from django.db import migrations, models


def migrate_status_to_archived(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Project.objects.filter(status__in=["completed", "paused"]).update(status="archived")


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(migrate_status_to_archived, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="project",
            name="status",
            field=models.CharField(
                choices=[("in_progress", "Ativo"), ("archived", "Arquivado")],
                default="in_progress",
                max_length=20,
            ),
        ),
    ]
