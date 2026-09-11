"""
Centralized test scenario data.

All parametrize argument lists live here so the test files stay declarative
and changes to business rules require edits in only one place.
"""

# ── Plans ──────────────────────────────────────────────────────────────────────

ALL_PLANS = ["free", "basic", "premium"]

PLAN_CREDITS = {"free": 10, "basic": 60, "premium": 150}

# ── Content helpers ────────────────────────────────────────────────────────────

# Generic short text — safe for every plan's word limit
CONTENT_SHORT = "palavra " * 100

# ── Register ───────────────────────────────────────────────────────────────────

REGISTER_PLAN_CASES = [
    # (plan, expected_initial_credits)
    ("free",    10),
    ("basic",   60),
    ("premium", 150),
]

# ── Chapter word limits ────────────────────────────────────────────────────────
# free → 5 000 words | basic → 15 000 words | premium → unlimited

CHAPTER_WORD_LIMIT_CASES = [
    # (plan, word_count, expected_http_status)
    ("free",     4_999, 201),   # just under free limit → OK
    ("free",     5_001, 400),   # just over  free limit → rejected
    ("basic",   14_999, 201),   # just under basic limit → OK
    ("basic",   15_001, 400),   # just over  basic limit → rejected
    ("premium", 20_000, 201),   # premium has no limit   → OK
]

# ── Analysis type access by plan ───────────────────────────────────────────────
# free blocks "total" and "book_total"

ANALYSIS_TYPE_PLAN_CASES = [
    # (plan, analysis_type, expected_http_status)
    ("free",    "total",      400),
    ("free",    "book_total", 400),
    ("basic",   "local",      201),  # simplest non-blocked type
    ("premium", "local",      201),
]

# premium-only (or restricted) types that paid plans can run
PAID_PLAN_PREMIUM_TYPE_CASES = [
    # (plan, analysis_type)
    ("basic",   "total"),
    ("premium", "total"),
    ("premium", "book_total"),
]

# ── Reader profile access by plan ──────────────────────────────────────────────
# free → ["luna"] | basic → ["luna","rafael","camila"] | premium → all 6

READER_PROFILE_CASES = [
    # (plan, profiles, expected_http_status)
    ("free",    ["luna"],                                                   201),
    ("free",    ["rafael"],                                                 400),  # not in free list
    ("free",    ["luna", "rafael"],                                         400),  # partial: rafael blocked
    ("basic",   ["luna", "rafael", "camila"],                               201),
    ("basic",   ["mateus"],                                                 400),  # mateus is premium-only
    ("premium", ["mateus", "vera", "heitor"],                               201),
    ("premium", ["luna", "rafael", "camila", "mateus", "vera", "heitor"],   201),  # all 6
]

# ── Credit balance after a 1-credit analysis ───────────────────────────────────

CREDIT_BALANCE_CASES = [
    # (plan, starting_credits, expected_remaining_after_local)
    ("free",    1, 0),
    ("basic",   5, 4),
    ("premium", 3, 2),
]

# ── Google Sign-In ──────────────────────────────────────────────────────────────


def google_payload(email, sub="google-sub-123", **overrides):
    """Fake decoded Google ID token payload, as returned by verify_oauth2_token."""
    payload = {
        "sub": sub,
        "email": email,
        "email_verified": True,
        "given_name": "Ana",
        "family_name": "Silva",
        "picture": "https://lh3.googleusercontent.com/a/photo.jpg",
    }
    payload.update(overrides)
    return payload
