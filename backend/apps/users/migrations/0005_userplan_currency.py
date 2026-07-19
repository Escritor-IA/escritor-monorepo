from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_userplan_stripe_ids"),
    ]

    operations = [
        migrations.AddField(
            model_name="userplan",
            name="currency",
            field=models.CharField(
                choices=[("brl", "BRL"), ("usd", "USD"), ("eur", "EUR")],
                default="brl",
                max_length=3,
            ),
        ),
    ]
