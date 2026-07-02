from django.urls import path
from .views import CreateCheckoutSessionView, WebhookView, ChangePlanView, CancelSubscriptionView

urlpatterns = [
    path("create-checkout-session/", CreateCheckoutSessionView.as_view(), name="create-checkout-session"),
    path("change-plan/", ChangePlanView.as_view(), name="change-plan"),
    path("cancel-subscription/", CancelSubscriptionView.as_view(), name="cancel-subscription"),
    path("webhook/", WebhookView.as_view(), name="stripe-webhook"),
]
