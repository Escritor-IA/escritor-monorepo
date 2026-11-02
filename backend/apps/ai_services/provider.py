"""
AI provider selection by environment variable.

AI_PROVIDER=groq (default) or AI_PROVIDER=gemini. One provider handles every
analysis; there is no automatic fallback between them.

Entry points:
    chat_completion(messages, model, max_tokens)  — same contract as groq_client
    get_provider() / get_model() / get_model_label()
    analysis_context(analysis_type)               — tags usage logs with the analysis type
"""
import os
import logging
from contextlib import contextmanager
from contextvars import ContextVar
from typing import List, Dict, Optional

from . import groq_client, gemini_client

logger = logging.getLogger(__name__)

_PROVIDERS = {
    "groq": (groq_client, "GROQ_MODEL", groq_client.GROQ_MODEL),
    "gemini": (gemini_client, "GEMINI_MODEL", gemini_client.GEMINI_MODEL),
}
DEFAULT_PROVIDER = "groq"

_current_analysis_type: ContextVar[str] = ContextVar("ai_analysis_type", default="unknown")


def get_provider() -> str:
    provider = os.environ.get("AI_PROVIDER", "").strip().lower() or DEFAULT_PROVIDER
    if provider not in _PROVIDERS:
        raise EnvironmentError(
            f"AI_PROVIDER inválido: '{provider}'. Use um destes: {', '.join(_PROVIDERS)}."
        )
    return provider


def get_model() -> str:
    _, env_var, default = _PROVIDERS[get_provider()]
    return os.environ.get(env_var, default)


def get_model_label() -> str:
    """Value stored in Analysis.ai_model, e.g. 'gemini:gemini-3.5-flash-lite'."""
    return f"{get_provider()}:{get_model()}"


@contextmanager
def analysis_context(analysis_type: str):
    token = _current_analysis_type.set(analysis_type)
    try:
        yield
    finally:
        _current_analysis_type.reset(token)


def chat_completion(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    max_tokens: int = 4096,
) -> str:
    provider = get_provider()
    client = _PROVIDERS[provider][0]
    model = model or get_model()

    def _log_usage(usage) -> None:
        try:
            logger.info(
                "AI usage provider=%s model=%s analysis_type=%s prompt_tokens=%s completion_tokens=%s total_tokens=%s",
                provider,
                model,
                _current_analysis_type.get(),
                getattr(usage, "prompt_tokens", None),
                getattr(usage, "completion_tokens", None),
                getattr(usage, "total_tokens", None),
            )
        except Exception:  # logging must never break an analysis
            logger.exception("Failed to log AI usage")

    return client.chat_completion(messages, model=model, max_tokens=max_tokens, on_usage=_log_usage)
