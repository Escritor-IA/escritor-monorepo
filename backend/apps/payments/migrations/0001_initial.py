import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Payment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("plan", models.CharField(choices=[("basic", "Autor"), ("premium", "Obra Completa")], max_length=20)),
                ("billing_cycle", models.CharField(choices=[("monthly", "Mensal"), ("annual", "Anual")], max_length=10)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=8)),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("paid", "Pago"), ("failed", "Falhou")], default="pending", max_length=20)),
                ("order_nsu", models.CharField(max_length=100, unique=True)),
                ("invoice_slug", models.CharField(blank=True, max_length=100)),
                ("transaction_nsu", models.CharField(blank=True, max_length=100)),
                ("capture_method", models.CharField(blank=True, max_length=20)),
                ("receipt_url", models.URLField(blank=True)),
                ("checkout_url", models.URLField(blank=True, max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Pagamento",
                "verbose_name_plural": "Pagamentos",
                "ordering": ["-created_at"],
            },
        ),
    ]
