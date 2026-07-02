import stripe
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import BaseParser
from rest_framework.response import Response
from rest_framework.views import APIView

stripe.api_key = settings.STRIPE_SECRET_KEY

PLAN_CONFIG = {
    "basic": {"name": "Escritor \xe2\x80\x94 Plano Autor", "amount": 2900, "credits": 60},
    "premium": {"name": "Escritor \xe2\x80\x94 Plano Obra Completa", "amount": 5900, "credits": 150},
}

AMOUNT_TO_PLAN = {v["amount"]: k for k, v in PLAN_CONFIG.items()}


class CreateCheckoutSessionView(APIView):
    def post(self, request):
        plan = request.data.get("plan")
        if plan not in PLAN_CONFIG:
            return Response({"error": "Plano inválido."}, status=status.HTTP_400_BAD_REQUEST)

        config = PLAN_CONFIG[plan]
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "brl",
                    "unit_amount": config["amount"],
                    "recurring": {"interval": "month"},
                    "product_data": {"name": config["name"]},
                },
                "quantity": 1,
            }],
            mode="subscription",
            client_reference_id=str(request.user.id),
            customer_email=request.user.email,
            metadata={"plan": plan, "user_id": str(request.user.id)},
            success_url=f"{settings.FRONTEND_URL}/checkout/processing",
            cancel_url=f"{settings.FRONTEND_URL}/select-plan?canceled=true",
        )
        return Response({"url": session.url})


class RawBodyParser(BaseParser):
    media_type = "*/*"

    def parse(self, stream, media_type=None, parser_context=None):
        return stream.read()


class WebhookView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [RawBodyParser]

    def post(self, request):
        payload = request.data
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({"error": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        event_type = event["type"]
        obj = event["data"]["object"]

        if event_type == "checkout.session.completed":
            self._on_checkout_completed(obj)
        elif event_type == "invoice.paid":
            self._on_invoice_paid(obj)
        elif event_type == "invoice.payment_failed":
            self._on_invoice_payment_failed(obj)
        elif event_type == "customer.subscription.updated":
            self._on_subscription_updated(obj)
        elif event_type == "customer.subscription.deleted":
            self._on_subscription_deleted(obj)

        return Response({"status": "ok"})

    def _on_checkout_completed(self, session):
        from apps.users.models import UserPlan

        # Guard: only activate when payment_status == "paid".
        # Async methods (boleto, pix) arrive as unpaid; invoice.paid fires later.
        if session.get("payment_status") != "paid":
            return

        user_id = session.get("client_reference_id")
        plan = (session.get("metadata") or {}).get("plan")

        if not user_id or plan not in PLAN_CONFIG:
            return

        UserPlan.objects.filter(user_id=user_id).update(
            plan=plan,
            credits=PLAN_CONFIG[plan]["credits"],
            billing_cycle="monthly",
            expires_at=timezone.now() + timedelta(days=30),
            stripe_customer_id=session.get("customer"),
            stripe_subscription_id=session.get("subscription"),
        )

    def _on_invoice_paid(self, invoice):
        """Idempotent safety net: activates or renews the plan on every confirmed payment.
        Covers async first-time payments and monthly renewals.
        Falls back to customer_email when stripe_customer_id is not yet linked."""
        from apps.users.models import UserPlan

        customer_id = invoice.get("customer")
        customer_email = invoice.get("customer_email")

        lines = (invoice.get("lines") or {}).get("data", [])
        amount = None
        for line in lines:
            unit_amount = (line.get("price") or {}).get("unit_amount")
            if unit_amount:
                amount = unit_amount
                break

        new_plan = AMOUNT_TO_PLAN.get(amount) if amount else None
        if not new_plan:
            return

        user_plan = None
        if customer_id:
            try:
                user_plan = UserPlan.objects.get(stripe_customer_id=customer_id)
            except UserPlan.DoesNotExist:
                pass

        if user_plan is None and customer_email:
            try:
                user_plan = UserPlan.objects.select_related("user").get(user__email=customer_email)
            except UserPlan.DoesNotExist:
                return

        if user_plan is None:
            return

        user_plan.plan = new_plan
        user_plan.credits = PLAN_CONFIG[new_plan]["credits"]
        user_plan.billing_cycle = "monthly"
        user_plan.expires_at = timezone.now() + timedelta(days=30)
        if customer_id:
            user_plan.stripe_customer_id = customer_id
        subscription_id = invoice.get("subscription")
        if subscription_id:
            user_plan.stripe_subscription_id = subscription_id
        user_plan.save(update_fields=[
            "plan", "credits", "billing_cycle", "expires_at",
            "stripe_customer_id", "stripe_subscription_id", "updated_at",
        ])

    def _on_invoice_payment_failed(self, invoice):
        # Stripe retries automatically; customer.subscription.deleted fires if all retries fail.
        customer_id = invoice.get("customer")
        if customer_id:
            print(f"[Stripe] Payment failed for customer {customer_id}")

    def _on_subscription_updated(self, subscription):
        """Upgrades/downgrades: reset credits to the new plan monthly amount."""
        from apps.users.models import UserPlan

        customer_id = subscription.get("customer")
        if not customer_id:
            return

        try:
            user_plan = UserPlan.objects.get(stripe_customer_id=customer_id)
        except UserPlan.DoesNotExist:
            return

        items = (subscription.get("items") or {}).get("data", [])
        if items:
            amount = (items[0].get("price") or {}).get("unit_amount")
            new_plan = AMOUNT_TO_PLAN.get(amount)
            if new_plan and new_plan != user_plan.plan:
                user_plan.plan = new_plan
                user_plan.credits = PLAN_CONFIG[new_plan]["credits"]
                user_plan.save(update_fields=["plan", "credits", "updated_at"])

    def _on_subscription_deleted(self, subscription):
        """Cancellation: downgrade to free and reset credits to 10."""
        from apps.users.models import UserPlan
        from apps.users.plans import PLAN_LIMITS

        customer_id = subscription.get("customer")
        if not customer_id:
            return

        try:
            user_plan = UserPlan.objects.get(stripe_customer_id=customer_id)
        except UserPlan.DoesNotExist:
            return

        user_plan.plan = "free"
        user_plan.credits = PLAN_LIMITS["free"]["credits_monthly"]
        user_plan.billing_cycle = None
        user_plan.expires_at = None
        user_plan.stripe_subscription_id = None
        user_plan.save(update_fields=[
            "plan", "credits", "billing_cycle", "expires_at",
            "stripe_subscription_id", "updated_at",
        ])


class ChangePlanView(APIView):
    """Upgrades or downgrades an existing subscription by modifying it in Stripe."""

    def post(self, request):
        new_plan = request.data.get("plan")
        if new_plan not in PLAN_CONFIG:
            return Response({"error": "Plano inválido."}, status=status.HTTP_400_BAD_REQUEST)

        user_plan = request.user.user_plan
        subscription_id = user_plan.stripe_subscription_id

        if not subscription_id:
            return Response({"error": "Sem assinatura ativa."}, status=status.HTTP_400_BAD_REQUEST)

        if user_plan.plan == new_plan:
            return Response({"error": "Você já está neste plano."}, status=status.HTTP_400_BAD_REQUEST)

        subscription = stripe.Subscription.retrieve(subscription_id)
        item_id = subscription["items"]["data"][0]["id"]

        new_config = PLAN_CONFIG[new_plan]
        stripe.Subscription.modify(
            subscription_id,
            items=[{
                "id": item_id,
                "price_data": {
                    "currency": "brl",
                    "unit_amount": new_config["amount"],
                    "recurring": {"interval": "month"},
                    "product_data": {"name": new_config["name"]},
                },
            }],
            proration_behavior="create_prorations",
        )

        return Response({"status": "ok"})


class CancelSubscriptionView(APIView):
    """Schedules cancellation at the end of the current billing period."""

    def post(self, request):
        user_plan = request.user.user_plan
        subscription_id = user_plan.stripe_subscription_id

        if not subscription_id:
            return Response({"error": "Sem assinatura ativa."}, status=status.HTTP_400_BAD_REQUEST)

        sub = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
        )

        return Response({
            "status": "cancelamento agendado",
            "cancel_at": sub.get("cancel_at"),
        })
