from django.urls import path
from .views import RegisterView, LoginView, MeView, VerifyEmailView, ResendOtpView, DeleteAccountView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("me/", MeView.as_view(), name="me"),
    path("me/delete/", DeleteAccountView.as_view(), name="delete-account"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("resend-otp/", ResendOtpView.as_view(), name="resend-otp"),
]
