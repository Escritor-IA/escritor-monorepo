from django.urls import path

from .views import CreateCheckoutView, PaymentStatusView, WebhookView

urlpatterns = [
    path("checkout/", CreateCheckoutView.as_view(), name="payment-checkout"),
    path("webhook/", WebhookView.as_view(), name="payment-webhook"),
    path("status/<str:order_nsu>/", PaymentStatusView.as_view(), name="payment-status"),
]
