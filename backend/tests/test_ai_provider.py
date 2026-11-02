"""
AI provider selection (AI_PROVIDER), Gemini client error mapping, usage logging.

Unit tests here never touch the database or the network: the SDK clients are
replaced by fakes. The last test is an integration check of Analysis.ai_model.
"""
import logging
from types import SimpleNamespace

import httpx
import pytest
import openai

from apps.ai_services import provider, gemini_client, groq_client


def _fake_response(content="ok", prompt_tokens=120, completion_tokens=30):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))],
        usage=SimpleNamespace(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
        ),
    )


class _FakeOpenAI:
    """Stands in for openai.OpenAI; records constructor kwargs and create() calls."""
    instances = []

    def __init__(self, **kwargs):
        self.kwargs = kwargs
        self.calls = []
        self.result = _fake_response()
        _FakeOpenAI.instances.append(self)
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.calls.append(kwargs)
        if isinstance(self.result, Exception):
            raise self.result
        return self.result


@pytest.fixture
def fake_openai(monkeypatch):
    _FakeOpenAI.instances = []
    monkeypatch.setattr(gemini_client, "OpenAI", _FakeOpenAI)
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    return _FakeOpenAI


def _status_error(cls, status_code):
    request = httpx.Request("POST", gemini_client.GEMINI_BASE_URL + "chat/completions")
    response = httpx.Response(status_code, request=request)
    return cls("quota exceeded for key test-gemini-key", response=response, body=None)


# ── Provider selection ─────────────────────────────────────────────────────────

def test_provider_defaults_to_groq_without_env(monkeypatch):
    monkeypatch.delenv("AI_PROVIDER", raising=False)
    monkeypatch.delenv("GROQ_MODEL", raising=False)
    assert provider.get_provider() == "groq"
    assert provider.get_model() == groq_client.GROQ_MODEL


@pytest.mark.parametrize("value", ["gemini", "GEMINI", " Gemini "])
def test_provider_gemini_is_case_and_space_insensitive(monkeypatch, value):
    monkeypatch.setenv("AI_PROVIDER", value)
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    assert provider.get_provider() == "gemini"
    assert provider.get_model_label() == "gemini:gemini-3.5-flash-lite"


def test_provider_invalid_value_raises(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "grok")
    with pytest.raises(EnvironmentError, match="AI_PROVIDER inválido"):
        provider.get_provider()


def test_model_label_uses_groq_model_env(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("GROQ_MODEL", "openai/gpt-oss-120b")
    assert provider.get_model_label() == "groq:openai/gpt-oss-120b"


def test_gemini_selected_never_calls_groq(monkeypatch, fake_openai):
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    def groq_must_not_run(*args, **kwargs):
        raise AssertionError("Groq called while AI_PROVIDER=gemini")

    monkeypatch.setattr(groq_client, "chat_completion", groq_must_not_run)
    assert provider.chat_completion([{"role": "user", "content": "oi"}], max_tokens=100) == "ok"


def test_groq_selected_never_calls_gemini(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setattr(
        gemini_client, "chat_completion",
        lambda *a, **k: (_ for _ in ()).throw(AssertionError("Gemini called while AI_PROVIDER=groq")),
    )
    monkeypatch.setattr(groq_client, "chat_completion", lambda messages, model, max_tokens, on_usage: "groq ok")
    assert provider.chat_completion([{"role": "user", "content": "oi"}]) == "groq ok"


def test_gemini_failure_does_not_fall_back_to_groq(monkeypatch, fake_openai):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    groq_calls = []
    monkeypatch.setattr(groq_client, "chat_completion", lambda *a, **k: groq_calls.append(1))

    original_init = _FakeOpenAI.__init__

    def init_failing(self, **kwargs):
        original_init(self, **kwargs)
        self.result = _status_error(openai.RateLimitError, 429)

    monkeypatch.setattr(_FakeOpenAI, "__init__", init_failing)

    with pytest.raises(RuntimeError):
        provider.chat_completion([{"role": "user", "content": "oi"}])
    assert groq_calls == []


# ── Gemini client ──────────────────────────────────────────────────────────────

def test_gemini_client_uses_openai_compatible_endpoint(monkeypatch, fake_openai):
    result = gemini_client.chat_completion(
        [{"role": "user", "content": "oi"}], model="gemini-3.5-flash-lite", max_tokens=321,
    )

    assert result == "ok"
    client = fake_openai.instances[0]
    assert client.kwargs["base_url"] == "https://generativelanguage.googleapis.com/v1beta/openai/"
    assert client.kwargs["api_key"] == "test-gemini-key"
    assert client.calls[0]["model"] == "gemini-3.5-flash-lite"
    assert client.calls[0]["max_tokens"] == 321


def test_gemini_client_missing_key_raises(monkeypatch, fake_openai):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(EnvironmentError, match="GEMINI_API_KEY"):
        gemini_client.chat_completion([{"role": "user", "content": "oi"}])
    assert fake_openai.instances == []


@pytest.mark.parametrize("exc_cls,status_code", [
    (openai.RateLimitError, 429),
    (openai.AuthenticationError, 401),
    (openai.PermissionDeniedError, 403),
])
def test_gemini_quota_auth_errors_become_runtime_error_without_leaking_key(
    monkeypatch, fake_openai, exc_cls, status_code,
):
    original_init = _FakeOpenAI.__init__

    def init_failing(self, **kwargs):
        original_init(self, **kwargs)
        self.result = _status_error(exc_cls, status_code)

    monkeypatch.setattr(_FakeOpenAI, "__init__", init_failing)

    with pytest.raises(RuntimeError) as excinfo:
        gemini_client.chat_completion([{"role": "user", "content": "oi"}])
    assert "test-gemini-key" not in str(excinfo.value)


def test_gemini_other_api_errors_propagate_as_openai_api_error(monkeypatch, fake_openai):
    original_init = _FakeOpenAI.__init__

    def init_failing(self, **kwargs):
        original_init(self, **kwargs)
        self.result = _status_error(openai.BadRequestError, 400)

    monkeypatch.setattr(_FakeOpenAI, "__init__", init_failing)

    with pytest.raises(openai.APIError):
        gemini_client.chat_completion([{"role": "user", "content": "oi"}])


# ── Usage logging ──────────────────────────────────────────────────────────────

def test_usage_logged_with_provider_model_and_analysis_type(monkeypatch, fake_openai, caplog):
    monkeypatch.setenv("AI_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    # settings.LOGGING sets propagate=False on apps.ai_services; caplog listens on root.
    monkeypatch.setattr(logging.getLogger("apps.ai_services"), "propagate", True)

    with caplog.at_level(logging.INFO, logger="apps.ai_services.provider"):
        with provider.analysis_context("book_general"):
            provider.chat_completion([{"role": "user", "content": "oi"}])

    line = next(r.getMessage() for r in caplog.records if "AI usage" in r.getMessage())
    assert "provider=gemini" in line
    assert "model=gemini-3.5-flash-lite" in line
    assert "analysis_type=book_general" in line
    assert "prompt_tokens=120" in line
    assert "completion_tokens=30" in line
    assert "test-gemini-key" not in line


def test_groq_client_reports_usage_and_keeps_return_contract(monkeypatch):
    """on_usage is optional: groq_client still returns the plain string and
    the rotation loop is untouched."""
    captured = []

    class FakeGroq:
        def __init__(self, api_key):
            self.chat = SimpleNamespace(
                completions=SimpleNamespace(create=lambda **kw: _fake_response("groq text", 50, 10))
            )

    monkeypatch.setattr(groq_client, "Groq", FakeGroq)
    monkeypatch.setattr(groq_client, "get_active_key", lambda: "gsk_test")

    messages = [{"role": "user", "content": "oi"}]
    assert groq_client.chat_completion(messages) == "groq text"
    assert groq_client.chat_completion(messages, on_usage=captured.append) == "groq text"
    assert captured[0].prompt_tokens == 50
    assert captured[0].completion_tokens == 10


def test_usage_log_failure_never_breaks_the_call(monkeypatch, fake_openai):
    monkeypatch.setenv("AI_PROVIDER", "gemini")

    original_init = _FakeOpenAI.__init__

    def init_without_usage(self, **kwargs):
        original_init(self, **kwargs)
        self.result.usage = None

    monkeypatch.setattr(_FakeOpenAI, "__init__", init_without_usage)
    assert provider.chat_completion([{"role": "user", "content": "oi"}]) == "ok"


# ── Integration: Analysis.ai_model records provider and model ──────────────────

@pytest.mark.parametrize("ai_provider,model_env,model,expected_label", [
    ("groq", "GROQ_MODEL", "openai/gpt-oss-120b", "groq:openai/gpt-oss-120b"),
    ("gemini", "GEMINI_MODEL", "gemini-3.5-flash-lite", "gemini:gemini-3.5-flash-lite"),
])
def test_analysis_records_provider_and_model(
    auth_client, user_free, make_project, make_chapter, mock_chat_completion,
    monkeypatch, ai_provider, model_env, model, expected_label,
):
    from apps.analyses.models import Analysis

    monkeypatch.setenv("AI_PROVIDER", ai_provider)
    monkeypatch.setenv(model_env, model)

    project = make_project(user_free)
    chapter = make_chapter(project, number=1, content="palavra " * 50)

    resp = auth_client(user_free).post("/api/analyses/run/", {
        "project_id":    str(project.pk),
        "chapter_id":    str(chapter.pk),
        "analysis_type": "local",
        "selected_text": "trecho",
    }, format="json")

    assert resp.status_code in (200, 201)
    assert Analysis.objects.get(project=project).ai_model == expected_label
