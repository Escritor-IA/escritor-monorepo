import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .plans import get_plan_limits


class User(AbstractUser):
    LANGUAGE_CHOICES = [
        ("pt-br", "Português (Brasil)"),
        ("en", "English"),
        ("fr", "Français"),
        ("es", "Español"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)
    preferred_language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default="pt-br")

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def __str__(self):
        return self.email


class UserPlan(models.Model):
    PLAN_CHOICES = [
        ("free", "Gratuito"),
        ("basic", "Básico"),
        ("premium", "Premium"),
    ]
    BILLING_CYCLE_CHOICES = [
        ("monthly", "Mensal"),
        ("annual", "Anual"),
    ]
    CURRENCY_CHOICES = [
        ("brl", "BRL"),
        ("usd", "USD"),
        ("eur", "EUR"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_plan")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    credits = models.IntegerField(default=10)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES, null=True, blank=True)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="brl")
    expires_at = models.DateTimeField(null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    stripe_subscription_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plano do Usuário"
        verbose_name_plural = "Planos dos Usuários"

    def __str__(self):
        return f"{self.user.email} — {self.get_plan_display()}"

    # ── Plan limit helpers ──────────────────────────────────────────────────

    @property
    def chapter_word_limit(self):
        return get_plan_limits(self.plan)["chapter_word_limit"]

    @property
    def allowed_reader_profiles(self):
        return get_plan_limits(self.plan)["allowed_reader_profiles"]

    @property
    def reader_simulation_weekly_limit(self):
        return get_plan_limits(self.plan)["reader_simulation_weekly_limit"]

    def is_analysis_type_allowed(self, analysis_type: str) -> bool:
        return analysis_type not in get_plan_limits(self.plan)["blocked_analysis_types"]

    def count_reader_simulations_this_week(self) -> int:
        from apps.analyses.models import Analysis

        week_ago = timezone.now() - timedelta(days=7)
        return Analysis.objects.filter(
            project__user=self.user,
            analysis_type__in=["reader_simulation", "book_reader_simulation"],
            created_at__gte=week_ago,
        ).count()

    def reset_credits(self):
        self.credits = get_plan_limits(self.plan)["credits_monthly"]
        self.save(update_fields=["credits", "updated_at"])
