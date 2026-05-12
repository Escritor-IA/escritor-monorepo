from django.db import models
from apps.users.models import User


class Project(models.Model):
    GENRE_CHOICES = [
        ("fantasy", "Fantasia"),
        ("romance", "Romance"),
        ("mystery", "Mistério"),
        ("horror", "Terror"),
        ("action", "Ação"),
        ("adventure", "Aventura"),
        ("children", "Infantil"),
        ("young_adult", "Jovem Adulto"),
        ("other", "Outro"),
    ]
    STATUS_CHOICES = [
        ("in_progress", "Em Andamento"),
        ("completed", "Concluído"),
        ("paused", "Pausado"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    title = models.CharField(max_length=200)
    genre = models.CharField(max_length=20, choices=GENRE_CHOICES)
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
