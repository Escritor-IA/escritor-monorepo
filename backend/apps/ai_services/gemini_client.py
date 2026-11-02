"""
Gemini API client via Google's OpenAI-compatible endpoint.

Mirrors groq_client's interface: chat_completion(messages, model, max_tokens)
Single key (GEMINI_API_KEY), no rotation. Quota/auth failures raise RuntimeError
so the view answers 503, the same way an exhausted Groq key pool does.
"""
import os
import logging
from typing import Callable, List, Dict, Optional

from openai import OpenAI
from openai import RateLimitError, AuthenticationError, PermissionDeniedError, APIStatusError

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
_MAX_RETRIES = 2      # SDK-level retries with backoff (429 / 5xx / connection errors)
_TIMEOUT_SECONDS = 90  # below gunicorn's --timeout 120


def _get_api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise EnvironmentError(
            "Nenhuma chave Gemini configurada. Defina GEMINI_API_KEY no arquivo .env."
        )
    return key


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = GEMINI_MODEL,
    max_tokens: int = 4096,
    on_usage: Optional[Callable] = None,
) -> str:
    client = OpenAI(
        api_key=_get_api_key(),
        base_url=GEMINI_BASE_URL,
        max_retries=_MAX_RETRIES,
        timeout=_TIMEOUT_SECONDS,
    )
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
        )
    except (RateLimitError, AuthenticationError, PermissionDeniedError) as exc:
        logger.warning("Gemini quota/auth error: %s", exc)
        raise RuntimeError(
            "O serviço de IA está temporariamente indisponível. Tente novamente em instantes."
        ) from exc
    except APIStatusError as exc:
        if exc.status_code in (429, 401, 403):
            logger.warning("Gemini API status %d", exc.status_code)
            raise RuntimeError(
                "O serviço de IA está temporariamente indisponível. Tente novamente em instantes."
            ) from exc
        raise

    if on_usage is not None:
        on_usage(response.usage)
    return response.choices[0].message.content or ""
