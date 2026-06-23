import logging
import uuid
from datetime import timedelta

import requests
from decouple import config
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import UserPlan
from apps.users.plans import get_plan_limits

from .models import Payment
from .serializers import CreateCheckoutSerializer, PaymentSerializer, WebhookPayloadSerializer
from .services import create_checkout_link, get_plan_price

logger = logging.getLogger(__name__)

PLAN_EXPIRY_DAYS = {"monthly": 31, "annual": 365}


class CreateCheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        plan = serializer.validated_data["plan"]
        billing_cycle = serializer.validated_data["billing_cycle"]
        product = get_plan_price(plan, billing_cycle)

        order_nsu = str(uuid.uuid4())
        payment = Payment.objects.create(
            user=request.user,
            plan=plan,
            billing_cycle=billing_cycle,
            amount=product["amount"],
            status="pending",
            order_nsu=order_nsu,
        )

        backend_url = config("BACKEND_URL", default="http://localhost:8000")
        frontend_url = config("FRONTEND_URL", default="http://localhost:5173")

        webhook_url = f"{backend_url}/api/payments/webhook/"
        redirect_url = f"{frontend_url}/pagamento/processando"

        try:
            full_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            result = create_checkout_link(
                order_nsu=payment.order_nsu,
                plan=plan,
                billing_cycle=billing_cycle,
                webhook_url=webhook_url,
                redirect_url=redirect_url,
                customer_name=full_name,
                customer_email=request.user.email,
            )
            checkout_url = result.get("url") or result.get("checkout_url") or result.get("link", "")
            payment.checkout_url = checkout_url
            payment.save(update_fields=["checkout_url"])
        except requests.HTTPError as exc:
            logger.error("InfinityPay checkout error: %s", exc)
            payment.status = "failed"
            payment.save(update_fields=["status"])
            return Response(
                {"detail": "Não foi possível criar o link de pagamento. Tente novamente."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class WebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = WebhookPayloadSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning("Webhook payload inválido: %s", serializer.errors)
            return Response({"success": False, "message": "Payload inválido."}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order_nsu = data["order_nsu"]

        try:
            payment = Payment.objects.select_related("user__user_plan").get(order_nsu=order_nsu)
        except Payment.DoesNotExist:
            logger.warning("Webhook recebido para order_nsu desconhecido: %s", order_nsu)
            return Response({"success": True, "message": None}, status=status.HTTP_200_OK)

        if payment.status == "paid":
            return Response({"success": True, "message": None}, status=status.HTTP_200_OK)

        payment.status = "paid"
        payment.invoice_slug = data["invoice_slug"]
        payment.transaction_nsu = data["transaction_nsu"]
        payment.capture_method = data["capture_method"]
        payment.receipt_url = data["receipt_url"]
        payment.save(update_fields=["status", "invoice_slug", "transaction_nsu", "capture_method", "receipt_url", "updated_at"])

        _activate_plan(payment)

        return Response({"success": True, "message": None}, status=status.HTTP_200_OK)


class PaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_nsu):
        try:
            payment = Payment.objects.get(order_nsu=order_nsu, user=request.user)
        except Payment.DoesNotExist:
            return Response({"detail": "Pagamento não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        expires_at = None
        if payment.status == "paid":
            try:
                expires_at = request.user.user_plan.expires_at.isoformat() if request.user.user_plan.expires_at else None
            except UserPlan.DoesNotExist:
                pass

        return Response({
            "status": payment.status,
            "plan": payment.plan,
            "billing_cycle": payment.billing_cycle,
            "amount": str(payment.amount),
            "capture_method": payment.capture_method,
            "order_nsu": payment.order_nsu,
            "receipt_url": payment.receipt_url,
            "expires_at": expires_at,
            "created_at": payment.created_at.isoformat(),
        })


def _activate_plan(payment: Payment) -> None:
    user_plan, _ = UserPlan.objects.get_or_create(user=payment.user)
    limits = get_plan_limits(payment.plan)

    user_plan.plan = payment.plan
    user_plan.billing_cycle = payment.billing_cycle
    user_plan.credits = limits["credits_monthly"]
    user_plan.expires_at = timezone.now() + timedelta(days=PLAN_EXPIRY_DAYS[payment.billing_cycle])
    user_plan.save(update_fields=["plan", "billing_cycle", "credits", "expires_at", "updated_at"])
