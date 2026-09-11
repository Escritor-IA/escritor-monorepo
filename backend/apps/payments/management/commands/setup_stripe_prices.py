import stripe
from django.conf import settings
from django.core.management.base import BaseCommand

stripe.api_key = settings.STRIPE_SECRET_KEY

PLANS = [
    {
        "key": "basic",
        "name": "Escritor — Plano Autor",
        "amounts": {"brl": 2900, "usd": 999, "eur": 949},
    },
    {
        "key": "premium",
        "name": "Escritor — Plano Obra Completa",
        "amounts": {"brl": 5900, "usd": 1999, "eur": 1899},
    },
]


class Command(BaseCommand):
    help = (
        "Creates (or reuses) the Stripe Products/Prices used for multi-currency checkout, "
        "printing the resulting price IDs to set as STRIPE_PRICE_BASIC / STRIPE_PRICE_PREMIUM."
    )

    def handle(self, *args, **options):
        for plan in PLANS:
            product = self._find_or_create_product(plan["name"])
            price = self._find_or_create_price(product, plan)
            self.stdout.write(
                self.style.SUCCESS(f"{plan['key']}: STRIPE_PRICE_{plan['key'].upper()}={price.id}")
            )

    def _find_or_create_product(self, name):
        existing = stripe.Product.list(active=True, limit=100)
        for product in existing.auto_paging_iter():
            if product.name == name:
                self.stdout.write(f"  Product já existe: {name} ({product.id})")
                return product

        product = stripe.Product.create(name=name)
        self.stdout.write(f"  Product criado: {name} ({product.id})")
        return product

    def _find_or_create_price(self, product, plan):
        amounts = plan["amounts"]
        existing_prices = stripe.Price.list(
            product=product.id, active=True, limit=100, expand=["data.currency_options"]
        )
        for price in existing_prices.auto_paging_iter():
            if self._price_matches(price, amounts):
                self.stdout.write(f"  Price já existe para {product.name}: {price.id}")
                return price

        price = stripe.Price.create(
            product=product.id,
            currency="brl",
            unit_amount=amounts["brl"],
            recurring={"interval": "month"},
            currency_options={
                "usd": {"unit_amount": amounts["usd"]},
                "eur": {"unit_amount": amounts["eur"]},
            },
        )
        self.stdout.write(f"  Price criado para {product.name}: {price.id}")
        return price

    def _price_matches(self, price, amounts):
        if price.currency != "brl" or price.unit_amount != amounts["brl"]:
            return False
        if not price.recurring or price.recurring.get("interval") != "month":
            return False
        currency_options = price.currency_options or {}
        for currency in ("usd", "eur"):
            option = currency_options.get(currency)
            if not option or option.get("unit_amount") != amounts[currency]:
                return False
        return True
