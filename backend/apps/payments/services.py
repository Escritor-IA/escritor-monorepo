import requests
from decouple import config

INFINITEPAY_API_URL = "https://api.checkout.infinitepay.io"

# Prices in centavos (InfinityPay expects integer)
PLAN_CATALOG = {
    ("basic", "monthly"): {"price": 2900, "description": "Plano Autor Mensal", "amount": "29.00"},
    ("basic", "annual"): {"price": 28800, "description": "Plano Autor Anual", "amount": "288.00"},
    ("premium", "monthly"): {"price": 5900, "description": "Plano Obra Completa Mensal", "amount": "59.00"},
    ("premium", "annual"): {"price": 58800, "description": "Plano Obra Completa Anual", "amount": "588.00"},
}


def get_plan_price(plan: str, billing_cycle: str) -> dict:
    """Returns catalog entry for a plan+cycle combo, or None if invalid."""
    return PLAN_CATALOG.get((plan, billing_cycle))


def create_checkout_link(
    order_nsu: str,
    plan: str,
    billing_cycle: str,
    webhook_url: str,
    redirect_url: str,
    customer_name: str = "",
    customer_email: str = "",
) -> dict:
    handle = config("INFINITEPAY_HANDLE")
    product = PLAN_CATALOG[(plan, billing_cycle)]

    payload = {
        "handle": handle,
        "order_nsu": order_nsu,
        "items": [
            {
                "quantity": 1,
                "price": product["price"],
                "description": product["description"],
            }
        ],
        "webhook_url": webhook_url,
        "redirect_url": redirect_url,
    }

    if customer_name or customer_email:
        payload["customer"] = {
            "name": customer_name,
            "email": customer_email,
        }

    response = requests.post(
        f"{INFINITEPAY_API_URL}/links",
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    return response.json()
