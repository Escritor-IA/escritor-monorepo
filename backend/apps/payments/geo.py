import requests
from django.core.cache import cache

EUROZONE_COUNTRY_CODES = {
    "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
    "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "HR",
}

GEO_LOOKUP_TIMEOUT = 1.5
CACHE_TTL = 60 * 60 * 24


def get_client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def detect_currency(ip):
    if not ip:
        return None

    cache_key = f"geo_currency:{ip}"
    cached = cache.get(cache_key, "MISS")
    if cached != "MISS":
        return cached

    currency = _lookup_currency(ip)
    cache.set(cache_key, currency, CACHE_TTL)
    return currency


def _lookup_currency(ip):
    try:
        response = requests.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "status,countryCode"},
            timeout=GEO_LOOKUP_TIMEOUT,
        )
        data = response.json()
    except (requests.RequestException, ValueError):
        return None

    if data.get("status") != "success":
        return None

    country_code = data.get("countryCode")
    if country_code == "BR":
        return "brl"
    if country_code in EUROZONE_COUNTRY_CODES:
        return "eur"
    if country_code:
        return "usd"
    return None
