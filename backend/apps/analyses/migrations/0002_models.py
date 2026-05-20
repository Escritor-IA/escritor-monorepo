import django.db.models.deletion
import pgvector.django
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analyses", "0001_initial"),
        ("chapters", "0001_initial"),
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Analysis",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("analysis_type", models.CharField(
                    choices=[
                        ("local", "Análise Local"),
                        ("local_context", "Análise Local com Contexto"),
                        ("general_context", "Análise Geral com Contexto"),
                        ("total", "Análise Total"),
                        ("reader_simulation", "Simulação de Leitores"),
                        ("creative_suggestion", "Sugestão Criativa"),
                    ],
                    max_length=25,
                )),
                ("reader_profiles", models.JSONField(blank=True, default=list)),
                ("content", models.TextField()),
                ("credits_consumed", models.PositiveIntegerField(default=1)),
                ("ai_model", models.CharField(max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("chapter", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="analyses",
                    to="chapters.chapter",
                )),
                ("project", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="analyses",
                    to="projects.project",
                )),
            ],
            options={
                "verbose_name": "Análise",
                "verbose_name_plural": "Análises",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ContextVector",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("text_excerpt", models.TextField()),
                ("embedding", pgvector.django.VectorField(dimensions=384)),
                ("indexed_at", models.DateTimeField(auto_now_add=True)),
                ("chapter", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="vectors",
                    to="chapters.chapter",
                )),
                ("project", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="vectors",
                    to="projects.project",
                )),
            ],
            options={
                "verbose_name": "Vetor de Contexto",
                "verbose_name_plural": "Vetores de Contexto",
            },
        ),
    ]
