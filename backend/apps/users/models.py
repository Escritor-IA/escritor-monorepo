from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    PROFILE_CHOICES = [
        ("beginner", "Iniciante"),
        ("experienced", "Experiente"),
    ]
    PLAN_CHOICES = [
        ("free", "Gratuito"),
        ("basic", "Básico"),
        ("premium", "Premium"),
    ]

    profile = models.CharField(max_length=20, choices=PROFILE_CHOICES, default="beginner")
    credits_balance = models.IntegerField(default=10)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="free")

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"

    def __str__(self):
        return self.email
