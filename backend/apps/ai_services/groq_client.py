"""
Groq API client with automatic key rotation on quota/rate-limit errors.

Single entry point: chat_completion(messages, model, max_tokens)
"""
import os
import logging
from typing import List, Dict

from groq import Groq
from groq import RateLimitError, AuthenticationError, APIStatusError

from .key_manager import get_active_key, rotate_key

logger = logging.getLogger(__name__)

GROQ_MODEL = os.environ.get("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
_MAX_RETRIES = 3


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = GROQ_MODEL,
    max_tokens: int = 4096,
) -> str:
    last_error: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        api_key = get_active_key()
        try:
            client = Groq(api_key=api_key)
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""

        except (RateLimitError, AuthenticationError) as exc:
            logger.warning("Groq key exhausted (attempt %d): %s", attempt + 1, exc)
            last_error = exc
            rotate_key()

        except APIStatusError as exc:
            if exc.status_code in (429, 401, 403):
                logger.warning("Groq API status %d (attempt %d)", exc.status_code, attempt + 1)
                last_error = exc
                rotate_key()
            else:
                raise

    raise RuntimeError(
        f"Todas as chaves Groq foram esgotadas após {_MAX_RETRIES} tentativas."
    ) from last_error
