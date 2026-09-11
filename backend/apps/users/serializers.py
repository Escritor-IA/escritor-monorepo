import logging
from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from django.conf import settings

from .models import User, UserPlan
from .services import create_default_user_plan
from .utils import generate_otp, send_otp_email

OTP_EXPIRY_MINUTES = 15

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "password", "password_confirm")

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password": "As senhas não conferem."})
        return attrs

    def create(self, validated_data):
        otp = generate_otp()
        user = User.objects.create_user(
            username=validated_data["username"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            email=validated_data["email"],
            password=validated_data["password"],
            is_email_verified=False,
            otp_code=otp,
            otp_expires_at=timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES),
        )
        create_default_user_plan(user)
        send_otp_email(user.username, user.email, otp)
        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Usuário não encontrado."})

        if user.is_email_verified:
            raise serializers.ValidationError({"email": "Email já verificado."})

        if user.otp_code != attrs["otp_code"]:
            raise serializers.ValidationError({"otp_code": "Código inválido."})

        if not user.otp_expires_at or timezone.now() > user.otp_expires_at:
            raise serializers.ValidationError({"otp_code": "Código expirado. Solicite um novo."})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.is_email_verified = True
        user.otp_code = None
        user.otp_expires_at = None
        user.save(update_fields=["is_email_verified", "otp_code", "otp_expires_at"])
        return user


class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Usuário não encontrado."})

        if user.is_email_verified:
            raise serializers.ValidationError({"email": "Email já verificado."})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        otp = generate_otp()
        user.otp_code = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        user.save(update_fields=["otp_code", "otp_expires_at"])
        send_otp_email(user.username, user.email, otp)
        return user


class UserPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPlan
        fields = ("plan", "credits", "billing_cycle", "expires_at", "currency")
        read_only_fields = ("plan", "credits", "billing_cycle", "expires_at", "currency")


class UserSerializer(serializers.ModelSerializer):
    user_plan = UserPlanSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "first_name", "last_name", "email",
            "user_plan", "date_joined", "preferred_language", "avatar_url",
        )
        read_only_fields = ("id", "user_plan", "date_joined", "avatar_url")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_field = self.username_field
        identifier = attrs.get(username_field, "")
        try:
            user = User.objects.get(email__iexact=identifier)
            attrs[username_field] = user.username
        except User.DoesNotExist:
            user = None

        if user is not None and user.google_id and not user.has_usable_password():
            raise serializers.ValidationError(
                {"code": "google_account", "detail": "Esta conta usa login com Google."}
            )

        data = super().validate(attrs)
        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {"email": "Verifique seu email antes de fazer login."}
            )
        data["user"] = UserSerializer(self.user).data
        return data


class GoogleAuthSerializer(serializers.Serializer):
    """
    Verifies a Google Identity Services ID token, then either logs the user in
    (existing google_id match), flags that account-linking confirmation is needed
    (existing password account, same email, confirm_link not yet sent), links the
    account (confirm_link=True), or creates a brand-new user.
    """

    credential = serializers.CharField(write_only=True)
    confirm_link = serializers.BooleanField(required=False, default=False)

    @staticmethod
    def _generate_unique_username(base):
        base = base or "user"
        username = base
        suffix = 1
        while User.objects.filter(username=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
        return username

    def validate(self, attrs):
        try:
            payload = google_id_token.verify_oauth2_token(
                attrs["credential"], google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except Exception:
            logger.warning("Google ID token verification failed", exc_info=True)
            raise serializers.ValidationError({"credential": "Token do Google inválido."})

        if not payload.get("email_verified"):
            raise serializers.ValidationError({"credential": "Email do Google não verificado."})

        google_id = payload["sub"]
        email = payload["email"]
        avatar_url = payload.get("picture", "")

        self.link_required = False
        self.is_new_user = False
        self.pending_email = None

        user = User.objects.filter(google_id=google_id).first()

        if user is None:
            existing = User.objects.filter(email__iexact=email).first()

            if existing is not None:
                if not attrs.get("confirm_link"):
                    self.link_required = True
                    self.pending_email = email
                    attrs["user"] = None
                    return attrs
                existing.google_id = google_id
                existing.avatar_url = avatar_url
                existing.save(update_fields=["google_id", "avatar_url"])
                user = existing
            else:
                username = self._generate_unique_username(email.split("@")[0])
                user = User.objects.create(
                    username=username,
                    email=email,
                    first_name=payload.get("given_name", ""),
                    last_name=payload.get("family_name", ""),
                    google_id=google_id,
                    avatar_url=avatar_url,
                    is_email_verified=True,
                )
                user.set_unusable_password()
                user.save(update_fields=["password"])
                create_default_user_plan(user)
                self.is_new_user = True

        attrs["user"] = user
        return attrs
