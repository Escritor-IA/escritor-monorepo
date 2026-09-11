"""
Tests for the analyses endpoints:
  GET    /api/analyses/
  GET    /api/analyses/<id>/
  DELETE /api/analyses/<id>/
  POST   /api/analyses/run/

Plan restrictions under test:
  Analysis types  → free blocks "total" and "book_total"
  Reader profiles → free: [luna] | basic: [luna,rafael,camila] | premium: all 6
  Weekly limit    → free: 2/week | basic/premium: unlimited
  Credits         → local=1 | reader_simulation=1/profile | book_reader_simulation=2/profile

All Groq API calls are replaced by the mock_chat_completion fixture (conftest.py).
"""

import uuid
import pytest

from apps.analyses.models import Analysis
from tests.fixtures import (
    ALL_PLANS,
    ANALYSIS_TYPE_PLAN_CASES,
    CREDIT_BALANCE_CASES,
    PAID_PLAN_PREMIUM_TYPE_CASES,
    PLAN_CREDITS,
    READER_PROFILE_CASES,
)

pytestmark = pytest.mark.django_db


# ── List ───────────────────────────────────────────────────────────────────────

def test_list_analyses_unauthenticated_returns_401(anon_client):
    resp = anon_client.get("/api/analyses/")
    assert resp.status_code == 401


@pytest.mark.parametrize("plan", ALL_PLANS)
def test_list_analyses_returns_only_own_analyses(
    auth_client, make_user, other_user, make_project, make_chapter, plan
):
    user = make_user(plan=plan)
    project = make_project(user)
    other_project = make_project(other_user)
    chapter = make_chapter(project, number=1)
    other_chapter = make_chapter(other_project, number=1)

    Analysis.objects.create(
        project=project, chapter=chapter,
        analysis_type="local", content="mine",
        credits_consumed=1, ai_model="test",
    )
    Analysis.objects.create(
        project=other_project, chapter=other_chapter,
        analysis_type="local", content="not mine",
        credits_consumed=1, ai_model="test",
    )

    resp = auth_client(user).get("/api/analyses/")

    assert resp.status_code == 200
    assert resp.data["count"] == 1
    assert resp.data["results"][0]["content"] == "mine"


def test_list_analyses_filterable_by_project(
    auth_client, user_free, make_project, make_chapter
):
    project_a = make_project(user_free, title="A")
    project_b = make_project(user_free, title="B")
    chapter_a = make_chapter(project_a, number=1)
    chapter_b = make_chapter(project_b, number=1)

    Analysis.objects.create(
        project=project_a, chapter=chapter_a,
        analysis_type="local", content="from A",
        credits_consumed=1, ai_model="test",
    )
    Analysis.objects.create(
        project=project_b, chapter=chapter_b,
        analysis_type="local", content="from B",
        credits_consumed=1, ai_model="test",
    )

    resp = auth_client(user_free).get(f"/api/analyses/?project={project_a.pk}")

    assert resp.status_code == 200
    assert resp.data["count"] == 1
    assert resp.data["results"][0]["content"] == "from A"


# ── Retrieve ───────────────────────────────────────────────────────────────────

def test_get_own_analysis_returns_200(auth_client, user_free, make_project, make_chapter):
    project = make_project(user_free)
    chapter = make_chapter(project, number=1)
    analysis = Analysis.objects.create(
        project=project, chapter=chapter,
        analysis_type="local", content="resultado",
        credits_consumed=1, ai_model="test",
    )

    resp = auth_client(user_free).get(f"/api/analyses/{analysis.pk}/")

    assert resp.status_code == 200
    assert resp.data["content"] == "resultado"


def test_get_another_users_analysis_returns_404(
    auth_client, user_free, other_user, make_project, make_chapter
):
    project = make_project(other_user)
    chapter = make_chapter(project, number=1)
    analysis = Analysis.objects.create(
        project=project, chapter=chapter,
        analysis_type="local", content="secret",
        credits_consumed=1, ai_model="test",
    )

    resp = auth_client(user_free).get(f"/api/analyses/{analysis.pk}/")

    assert resp.status_code == 404


# ── Delete ─────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_delete_own_analysis(auth_client, make_user, make_project, make_chapter, plan):
    user = make_user(plan=plan)
    project = make_project(user)
    chapter = make_chapter(project, number=1)
    analysis = Analysis.objects.create(
        project=project, chapter=chapter,
        analysis_type="local", content="test",
        credits_consumed=1, ai_model="test",
    )
    analysis_id = analysis.pk

    resp = auth_client(user).delete(f"/api/analyses/{analysis.pk}/")

    assert resp.status_code == 204
    assert not Analysis.objects.filter(pk=analysis_id).exists()


def test_delete_another_users_analysis_returns_404(
    auth_client, user_free, other_user, make_project, make_chapter
):
    project = make_project(other_user)
    chapter = make_chapter(project, number=1)
    analysis = Analysis.objects.create(
        project=project, chapter=chapter,
        analysis_type="local", content="test",
        credits_consumed=1, ai_model="test",
    )

    resp = auth_client(user_free).delete(f"/api/analyses/{analysis.pk}/")

    assert resp.status_code == 404
    assert Analysis.objects.filter(pk=analysis.pk).exists()


# ── Run — Authentication ───────────────────────────────────────────────────────

def test_run_analysis_unauthenticated_returns_401(anon_client):
    resp = anon_client.post("/api/analyses/run/", {})
    assert resp.status_code == 401


# ── Run — Analysis type access by plan ────────────────────────────────────────

@pytest.mark.parametrize("plan,analysis_type,expected_status", ANALYSIS_TYPE_PLAN_CASES)
def test_run_analysis_plan_access_by_type(
    auth_client, make_user, make_project, make_chapter,
    mock_chat_completion, plan, analysis_type, expected_status,
):
    user = make_user(plan=plan)
    project = make_project(user)
    chapter = make_chapter(project, number=1, content="palavra " * 200)

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": analysis_type,
        "selected_text": "trecho selecionado",
    }, format="json")

    assert resp.status_code == expected_status


@pytest.mark.parametrize("analysis_type", ["total", "book_total"])
def test_blocked_analysis_type_response_contains_field_error(
    auth_client, user_free, make_project, make_chapter, analysis_type
):
    """The 400 response must name the offending field."""
    project = make_project(user_free)
    chapter = make_chapter(project, number=1, content="palavra " * 100)

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": analysis_type,
    }, format="json")

    assert resp.status_code == 400
    assert "analysis_type" in resp.data


@pytest.mark.parametrize("plan,analysis_type", PAID_PLAN_PREMIUM_TYPE_CASES)
def test_paid_plans_can_run_premium_analysis_types(
    auth_client, make_user, make_project, make_chapter,
    mock_chat_completion, plan, analysis_type,
):
    user = make_user(plan=plan, credits=PLAN_CREDITS[plan])
    project = make_project(user)
    chapter = make_chapter(project, number=1, content="palavra " * 200)

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": analysis_type,
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 201


# ── Run — Reader profile access by plan ───────────────────────────────────────

@pytest.mark.parametrize("plan,profiles,expected_status", READER_PROFILE_CASES)
def test_reader_simulation_profile_access_by_plan(
    auth_client, make_user, make_project, make_chapter,
    mock_chat_completion, plan, profiles, expected_status,
):
    user = make_user(plan=plan, credits=PLAN_CREDITS[plan])
    project = make_project(user)
    chapter = make_chapter(project, number=1, content="palavra " * 100)

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":      str(project.pk),
        "chapter_id":      str(chapter.pk),
        "analysis_type":   "reader_simulation",
        "reader_profiles": profiles,
    }, format="json")

    assert resp.status_code == expected_status


def test_reader_simulation_requires_at_least_one_profile(
    auth_client, user_premium, make_project, make_chapter
):
    project = make_project(user_premium)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user_premium).post("/api/analyses/run/", {
        "project_id":      str(project.pk),
        "chapter_id":      str(chapter.pk),
        "analysis_type":   "reader_simulation",
        "reader_profiles": [],
    }, format="json")

    assert resp.status_code == 400
    assert "reader_profiles" in resp.data


# ── Run — Weekly simulation limit ─────────────────────────────────────────────

def test_free_user_hits_weekly_reader_simulation_limit(
    auth_client, user_free, make_project, make_chapter, mock_chat_completion
):
    """After 2 simulations this week, the free user's 3rd attempt is blocked."""
    project = make_project(user_free)
    chapter = make_chapter(project, number=1, content="palavra " * 100)

    for _ in range(2):
        Analysis.objects.create(
            project=project, chapter=chapter,
            analysis_type="reader_simulation",
            reader_profiles=["luna"], content="{}",
            credits_consumed=1, ai_model="test",
        )

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":      str(project.pk),
        "chapter_id":      str(chapter.pk),
        "analysis_type":   "reader_simulation",
        "reader_profiles": ["luna"],
    }, format="json")

    assert resp.status_code == 400
    assert "reader_profiles" in resp.data


@pytest.mark.parametrize("plan", ["basic", "premium"])
def test_paid_plans_have_no_weekly_reader_simulation_limit(
    auth_client, make_user, make_project, make_chapter, mock_chat_completion, plan
):
    """basic and premium are never blocked by the weekly threshold."""
    user = make_user(plan=plan, credits=10)
    project = make_project(user)
    chapter = make_chapter(project, number=1, content="palavra " * 100)

    for _ in range(5):
        Analysis.objects.create(
            project=project, chapter=chapter,
            analysis_type="reader_simulation",
            reader_profiles=["luna"], content="{}",
            credits_consumed=1, ai_model="test",
        )

    user.user_plan.credits = 5
    user.user_plan.save()

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":      str(project.pk),
        "chapter_id":      str(chapter.pk),
        "analysis_type":   "reader_simulation",
        "reader_profiles": ["luna"],
    }, format="json")

    assert resp.status_code == 201


# ── Run — Credit deduction ─────────────────────────────────────────────────────

def test_successful_analysis_deducts_one_credit(
    auth_client, user_free, make_project, make_chapter, mock_chat_completion
):
    project = make_project(user_free)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho selecionado",
    }, format="json")

    assert resp.status_code == 201
    assert resp.data["credits_remaining"] == 9  # free starts with 10
    user_free.user_plan.refresh_from_db()
    assert user_free.user_plan.credits == 9


@pytest.mark.parametrize("plan,start_credits,expected_remaining", CREDIT_BALANCE_CASES)
def test_credit_balance_after_local_analysis(
    auth_client, make_user, make_project, make_chapter,
    mock_chat_completion, plan, start_credits, expected_remaining,
):
    user = make_user(plan=plan, credits=start_credits)
    project = make_project(user)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 201
    assert resp.data["credits_remaining"] == expected_remaining


def test_reader_simulation_deducts_one_credit_per_profile(
    auth_client, user_premium, make_project, make_chapter, mock_chat_completion
):
    """reader_simulation costs 1 credit × number of profiles."""
    user_premium.user_plan.credits = 10
    user_premium.user_plan.save()

    project = make_project(user_premium)
    chapter = make_chapter(project, number=1)
    profiles = ["luna", "rafael", "camila"]  # 3 profiles = 3 credits

    resp = auth_client(user_premium).post("/api/analyses/run/", {
        "project_id":      str(project.pk),
        "chapter_id":      str(chapter.pk),
        "analysis_type":   "reader_simulation",
        "reader_profiles": profiles,
    }, format="json")

    assert resp.status_code == 201
    assert resp.data["credits_remaining"] == 7  # 10 - 3 = 7


# ── Run — Insufficient credits ─────────────────────────────────────────────────

@pytest.mark.parametrize("plan", ALL_PLANS)
def test_run_analysis_with_zero_credits_is_blocked(
    auth_client, make_user, make_project, make_chapter, plan,
):
    user = make_user(plan=plan, credits=0)
    project = make_project(user)
    chapter = make_chapter(project, number=1)

    resp = auth_client(user).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 400
    assert "Créditos insuficientes" in resp.data.get("detail", "")


# ── Run — Validation errors ────────────────────────────────────────────────────

def test_run_analysis_with_unknown_project_returns_404(auth_client, user_free):
    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(uuid.uuid4()),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 404


def test_run_analysis_missing_required_fields_returns_400(auth_client, user_free):
    resp = auth_client(user_free).post("/api/analyses/run/", {}, format="json")
    assert resp.status_code == 400


# ── Run — Groq failures ─────────────────────────────────────────────────────────

def test_run_analysis_returns_503_when_all_groq_keys_exhausted(
    auth_client, user_free, make_project, make_chapter, monkeypatch,
):
    def raise_runtime_error(messages, model=None, max_tokens=None):
        raise RuntimeError("Todas as chaves Groq foram esgotadas após 3 tentativas.")

    monkeypatch.setattr(
        "apps.ai_services.analysis_service.chat_completion", raise_runtime_error
    )

    project = make_project(user_free)
    chapter = make_chapter(project, number=1, content="palavra " * 50)

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 503
    assert "esgotadas" in resp.data["detail"]


def test_run_analysis_returns_502_and_hides_raw_groq_error_on_api_error(
    auth_client, user_free, make_project, make_chapter, monkeypatch,
):
    """A Groq APIError (e.g. invalid/decommissioned model) must never leak its raw
    message or internal state to the client — only a generic detail."""
    import httpx
    from groq import APIError

    secret_detail = "model `decommissioned-model-xyz` has been decommissioned"

    def raise_api_error(messages, model=None, max_tokens=None):
        request = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
        raise APIError(secret_detail, request=request, body=None)

    monkeypatch.setattr(
        "apps.ai_services.analysis_service.chat_completion", raise_api_error
    )

    project = make_project(user_free)
    chapter = make_chapter(project, number=1, content="palavra " * 50)

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code == 502
    assert secret_detail not in resp.data["detail"]
