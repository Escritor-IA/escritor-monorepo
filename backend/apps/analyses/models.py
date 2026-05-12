from django.db import models
from pgvector.django import VectorField

from apps.projects.models import Project
from apps.chapters.models import Chapter


class Analysis(models.Model):
    ANALYSIS_TYPES = [
        ("local", "Análise Local"),
        ("local_context", "Análise Local com Contexto"),
        ("general", "Análise Geral"),
        ("total", "Análise Total"),
        ("reader_simulation", "Simulação de Leitores"),
        ("creative_suggestion", "Sugestão Criativa"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="analyses")
    chapter = models.ForeignKey(
        Chapter, on_delete=models.SET_NULL, related_name="analyses", null=True, blank=True
    )
    analysis_type = models.CharField(max_length=25, choices=ANALYSIS_TYPES)
    content = models.TextField()
    credits_consumed = models.PositiveIntegerField(default=1)
    ai_model = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Análise"
        verbose_name_plural = "Análises"

    def __str__(self):
        return f"{self.get_analysis_type_display()} — {self.project.title}"


class ContextVector(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="vectors")
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="vectors")
    text_excerpt = models.TextField()
    embedding = VectorField(dimensions=384)
    indexed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Vetor de Contexto"
        verbose_name_plural = "Vetores de Contexto"

    def __str__(self):
        return f"Vector [{self.chapter}] — {self.text_excerpt[:50]}"
