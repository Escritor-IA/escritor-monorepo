import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Chapter",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("number", models.PositiveIntegerField()),
                ("title", models.CharField(blank=True, max_length=200)),
                ("content", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("project", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="chapters",
                    to="projects.project",
                )),
            ],
            options={
                "verbose_name": "Capítulo",
                "verbose_name_plural": "Capítulos",
                "ordering": ["number"],
                "unique_together": {("project", "number")},
            },
        ),
    ]
