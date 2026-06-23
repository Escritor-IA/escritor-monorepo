from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "billing_cycle", "amount", "status", "capture_method", "created_at"]
    list_filter = ["status", "plan", "billing_cycle", "capture_method"]
    search_fields = ["user__email", "order_nsu", "transaction_nsu", "invoice_slug"]
    readonly_fields = [
        "id", "user", "plan", "billing_cycle", "amount",
        "order_nsu", "invoice_slug", "transaction_nsu",
        "capture_method", "receipt_url", "checkout_url",
        "created_at", "updated_at",
    ]
    ordering = ["-created_at"]
