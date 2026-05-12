from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("genre", models.CharField(
                    choices=[
                        ("fantasy", "Fantasia"),
                        ("romance", "Romance"),
                        ("mystery", "Mistério"),
                        ("horror", "Terror"),
                        ("action", "Ação"),
                        ("adventure", "Aventura"),
                        ("children", "Infantil"),
                        ("young_adult", "Jovem Adulto"),
                        ("other", "Outro"),
                    ],
                    max_length=20,
                )),
                ("synopsis", models.TextField(blank=True)),
                ("status", models.CharField(
                    choices=[
                        ("in_progress", "Em Andamento"),
                        ("completed", "Concluído"),
                        ("paused", "Pausado"),
                    ],
                    default="in_progress",
                    max_length=20,
                )),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="projects",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                "verbose_name": "Projeto",
                "verbose_name_plural": "Projetos",
                "ordering": ["-updated_at"],
            },
        ),
    ]
