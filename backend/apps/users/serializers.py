from datetime import timedelta

from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, UserPlan
from .utils import generate_otp, send_otp_email

OTP_EXPIRY_MINUTES = 15


PLAN_INITIAL_CREDITS = {
    "free": 10,
    "basic": 60,
    "premium": 150,
}


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
        UserPlan.objects.create(user=user, plan="free", credits=PLAN_INITIAL_CREDITS["free"])
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
        fields = ("plan", "credits", "billing_cycle", "expires_at")
        read_only_fields = ("plan", "credits", "billing_cycle", "expires_at")


class UserSerializer(serializers.ModelSerializer):
    user_plan = UserPlanSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "user_plan", "date_joined", "preferred_language")
        read_only_fields = ("id", "user_plan", "date_joined")


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username_field = self.username_field
        identifier = attrs.get(username_field, "")
        try:
            user = User.objects.get(email__iexact=identifier)
            attrs[username_field] = user.username
        except User.DoesNotExist:
            pass
        data = super().validate(attrs)
        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {"email": "Verifique seu email antes de fazer login."}
            )
        data["user"] = UserSerializer(self.user).data
        return data
