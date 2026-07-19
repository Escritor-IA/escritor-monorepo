from django.urls import path
from .views import (
    CreateCheckoutSessionView,
    WebhookView,
    ChangePlanView,
    CancelSubscriptionView,
    PlanPricesView,
)

urlpatterns = [
    path("plan-prices/", PlanPricesView.as_view(), name="plan-prices"),
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("change-plan/", ChangePlanView.as_view(), name="change-plan"),
    path("cancel-subscription/", CancelSubscriptionView.as_view(), name="cancel-subscription"),
    path("webhook/", WebhookView.as_view(), name="stripe-webhook"),
]
