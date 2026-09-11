from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_user_preferred_language"),
    ]

    operations = [
        migrations.AddField(
            model_name="userplan",
            name="stripe_customer_id",
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="userplan",
            name="stripe_subscription_id",
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
    ]
