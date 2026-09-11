"""
Centralized plan limits. Single source of truth for what each plan allows.
Never import heavy models here — this module must stay lightweight and importable early.
"""

# Profiles in display/tier order. Free gets index 0, basic gets 0-2, premium gets all.
READER_PROFILES_ORDER = ["luna", "rafael", "camila", "mateus", "vera", "heitor"]

PLAN_LIMITS = {
    "free": {
        "credits_monthly": 10,
        "chapter_word_limit": 5_000,
        "blocked_analysis_types": frozenset(["total", "book_total"]),
        "allowed_reader_profiles": ["luna"],
        "reader_simulation_weekly_limit": 2,
    },
    "basic": {
        "credits_monthly": 60,
        "chapter_word_limit": 15_000,
        "blocked_analysis_types": frozenset(),
        "allowed_reader_profiles": ["luna", "rafael", "camila"],
        "reader_simulation_weekly_limit": None,  # unlimited
    },
    "premium": {
        "credits_monthly": 150,
        "chapter_word_limit": None,  # unlimited
        "blocked_analysis_types": frozenset(),
        "allowed_reader_profiles": None,  # all profiles
        "reader_simulation_weekly_limit": None,  # unlimited
    },
}


def get_plan_limits(plan: str) -> dict:
    return PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
