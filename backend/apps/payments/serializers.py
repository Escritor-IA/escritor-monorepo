from rest_framework import serializers

from .models import Payment
from .services import PLAN_CATALOG


class CreateCheckoutSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=["basic", "premium"])
    billing_cycle = serializers.ChoiceField(choices=["monthly", "annual"])

    def validate(self, attrs):
        key = (attrs["plan"], attrs["billing_cycle"])
        if key not in PLAN_CATALOG:
            raise serializers.ValidationError("Combinação de plano e ciclo inválida.")
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "plan",
            "billing_cycle",
            "amount",
            "status",
            "checkout_url",
            "receipt_url",
            "created_at",
        ]
        read_only_fields = fields


class WebhookPayloadSerializer(serializers.Serializer):
    invoice_slug = serializers.CharField()
    amount = serializers.IntegerField()
    paid_amount = serializers.IntegerField()
    installments = serializers.IntegerField()
    capture_method = serializers.CharField()
    transaction_nsu = serializers.CharField()
    order_nsu = serializers.CharField()
    receipt_url = serializers.URLField()
    items = serializers.ListField(child=serializers.DictField(), required=False)
