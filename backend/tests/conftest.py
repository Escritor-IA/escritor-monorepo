"""
Shared fixtures for the entire test suite.

Factories (make_*) are for parametrized tests that need dynamic setup.
Named fixtures (user_free, user_basic…) are for tests that target one
specific persona and should read like a story: "as a free user, I...".

Email sending and Groq API calls are suppressed globally.
"""

import uuid
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, UserPlan
from apps.projects.models import Project
from apps.chapters.models import Chapter
from tests.fixtures import CONTENT_SHORT, PLAN_CREDITS


# ── Low-level factories ────────────────────────────────────────────────────────

@pytest.fixture
def make_user(db):
    """
    Dynamic user factory for parametrized tests.

    Usage:
        make_user()                           # free, 10 credits, verified
        make_user(plan="premium")             # premium, 150 credits
        make_user(plan="basic", credits=0)    # basic, 0 credits
        make_user(verified=False)             # unverified (OTP flow)
    """
    def _make(plan="free", credits=None, verified=True, **kwargs):
        uid = uuid.uuid4().hex[:8]
        user = User.objects.create_user(
            username=kwargs.get("username", f"user_{uid}"),
            email=kwargs.get("email", f"{uid}@test.com"),
            password="TestPass123!",
            is_email_verified=verified,
        )
        UserPlan.objects.create(
            user=user,
            plan=plan,
            credits=credits if credits is not None else PLAN_CREDITS[plan],
        )
        return user

    return _make


@pytest.fixture
def make_project(db):
    """Dynamic project factory."""
    def _make(user, title="Test Project", **kwargs):
        return Project.objects.create(user=user, title=title, **kwargs)

    return _make


@pytest.fixture
def make_chapter(db):
    """Dynamic chapter factory."""
    def _make(project, number=1, content=CONTENT_SHORT, **kwargs):
        return Chapter.objects.create(project=project, number=number, content=content, **kwargs)

    return _make


# ── Named user personas ────────────────────────────────────────────────────────

@pytest.fixture
def user_free(make_user):
    return make_user(plan="free")


@pytest.fixture
def user_basic(make_user):
    return make_user(plan="basic")


@pytest.fixture
def user_premium(make_user):
    return make_user(plan="premium")


@pytest.fixture
def user_unverified(make_user):
    """User who registered but has not verified their email yet."""
    return make_user(verified=False)


@pytest.fixture
def user_broke(make_user):
    """Free user with zero credits — triggers insufficient-credits errors."""
    return make_user(plan="free", credits=0)


@pytest.fixture
def other_user(make_user):
    """A second, unrelated user — used in ownership / security tests."""
    return make_user(plan="free")


# ── HTTP clients ───────────────────────────────────────────────────────────────

@pytest.fixture
def anon_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def auth_client():
    """
    Factory: auth_client(user) → authenticated APIClient.
    Generates a JWT access token in memory — no HTTP round-trip.
    """
    def _client(user):
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        return client

    return _client


# ── Global side-effect suppression ────────────────────────────────────────────

@pytest.fixture(autouse=True)
def no_emails(monkeypatch):
    """Prevent any OTP email from actually being sent."""
    monkeypatch.setattr("apps.users.serializers.send_otp_email", lambda *a, **kw: None)


@pytest.fixture
def mock_chat_completion(monkeypatch):
    """
    Replace the Groq API call with a canned string.
    Apply to any test that exercises a successful analysis run.
    """
    monkeypatch.setattr(
        "apps.ai_services.analysis_service.chat_completion",
        lambda messages, model=None, max_tokens=None: "Resposta simulada da IA.",
    )
