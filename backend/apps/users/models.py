import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)

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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="user_plan")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    credits = models.IntegerField(default=10)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES, null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plano do Usuário"
        verbose_name_plural = "Planos dos Usuários"

    def __str__(self):
        return f"{self.user.email} — {self.get_plan_display()}"
