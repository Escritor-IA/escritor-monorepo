import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    PLAN_CHOICES = [
        ("free", "Gratuito"),
        ("basic", "Básico"),
        ("premium", "Premium"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credits_balance = models.IntegerField(default=10)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")
    is_email_verified = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def __str__(self):
        return self.email
