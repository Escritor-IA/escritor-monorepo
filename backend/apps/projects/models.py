import uuid

from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.users.models import User


class Project(models.Model):
    GENRE_SUGGESTIONS = [
        "fantasy", "romance", "mystery", "horror", "action",
        "adventure", "children", "young_adult", "sci_fi", "thriller",
        "historical", "biography", "self_help", "other",
    ]
    STATUS_CHOICES = [
        ("in_progress", "Em Andamento"),
        ("completed", "Concluído"),
        ("paused", "Pausado"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=200)
    genres = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    synopsis = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_progress")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Projeto"
        verbose_name_plural = "Projetos"

    def __str__(self):
        return f"{self.title} ({self.user.username})"
