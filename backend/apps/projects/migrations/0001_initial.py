import django.contrib.postgres.fields
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Project",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200)),
                ("genres", django.contrib.postgres.fields.ArrayField(
                    base_field=models.CharField(max_length=100),
                    blank=True,
                    default=list,
                    size=None,
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
