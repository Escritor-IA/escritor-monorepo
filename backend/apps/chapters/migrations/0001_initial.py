from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Chapter",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.PositiveIntegerField()),
                ("title", models.CharField(blank=True, max_length=200)),
                ("content", models.TextField(blank=True)),
                ("version", models.PositiveIntegerField(default=1)),
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
