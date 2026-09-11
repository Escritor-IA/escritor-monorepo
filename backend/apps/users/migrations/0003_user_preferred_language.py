from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_first_last_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="preferred_language",
            field=models.CharField(
                choices=[
                    ("pt-br", "Português (Brasil)"),
                    ("en", "English"),
                    ("fr", "Français"),
                    ("es", "Español"),
                ],
                default="pt-br",
                max_length=10,
            ),
        ),
    ]
