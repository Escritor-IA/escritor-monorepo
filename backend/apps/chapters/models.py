import uuid

from django.db import models

from apps.projects.models import Project


class Chapter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="chapters")
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]
        unique_together = ["project", "number"]
        verbose_name = "Capítulo"
        verbose_name_plural = "Capítulos"

    def __str__(self):
        return f"Cap. {self.number} — {self.title or 'Sem título'} ({self.project.title})"
