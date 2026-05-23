import random
import string
from django.core.mail import send_mail
from django.conf import settings


def generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def send_otp_email(username:str, email: str, otp_code: str) -> None:
    send_mail(
        subject="Seu código de verificação - Escritor.AI",
        message=(
            f"Olá, {username}!\n\n"
            f"Seu código de verificação é: {otp_code}\n\n"
            f"Este código expira em 15 minutos.\n\n"
            f"Se você não criou uma conta no Escritor.AI, ignore este email."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
