from django.db import models
from apps.projects.models import Project


class Chapter(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="chapters")
    number = models.PositiveIntegerField()
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    version = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]
        unique_together = ["project", "number"]
        verbose_name = "Capítulo"
        verbose_name_plural = "Capítulos"

    def __str__(self):
        return f"Cap. {self.number} — {self.title or 'Sem título'} ({self.project.title})"

    def save(self, *args, **kwargs):
        if self.pk:
            self.version += 1
        super().save(*args, **kwargs)
