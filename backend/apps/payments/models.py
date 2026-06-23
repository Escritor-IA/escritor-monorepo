import uuid

from django.db import models

from apps.users.models import User


class Payment(models.Model):
    PLAN_CHOICES = [
        ("basic", "Autor"),
        ("premium", "Obra Completa"),
    ]
    BILLING_CYCLE_CHOICES = [
        ("monthly", "Mensal"),
        ("annual", "Anual"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("paid", "Pago"),
        ("failed", "Falhou"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="payments")
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CYCLE_CHOICES)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # InfinityPay tracking fields
    order_nsu = models.CharField(max_length=100, unique=True)
    invoice_slug = models.CharField(max_length=100, blank=True)
    transaction_nsu = models.CharField(max_length=100, blank=True)
    capture_method = models.CharField(max_length=20, blank=True)
    receipt_url = models.URLField(blank=True)
    checkout_url = models.URLField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pagamento"
        verbose_name_plural = "Pagamentos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} — {self.get_plan_display()} {self.get_billing_cycle_display()} ({self.status})"
