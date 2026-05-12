"""
Manages multiple Groq API keys and rotates automatically when a key hits its quota.

Usage:
    from apps.ai_services.key_manager import get_active_key, rotate_key
"""
import os
import logging
from typing import List

logger = logging.getLogger(__name__)

_keys: List[str] = []
_current_index: int = 0


def _load_keys() -> List[str]:
    keys: List[str] = []
    i = 1
    while True:
        key = os.environ.get(f"GROQ_API_KEY_{i}")
        if not key:
            break
        keys.append(key.strip())
        i += 1

    if not keys:
        single = os.environ.get("GROQ_API_KEY", "").strip()
        if single:
            keys.append(single)

    return keys


def get_active_key() -> str:
    global _keys, _current_index
    if not _keys:
        _keys = _load_keys()
    if not _keys:
        raise EnvironmentError(
            "Nenhuma chave Groq configurada. "
            "Defina GROQ_API_KEY_1 (ou GROQ_API_KEY) no arquivo .env."
        )
    return _keys[_current_index % len(_keys)]


def rotate_key() -> str:
    global _current_index, _keys
    if not _keys:
        _keys = _load_keys()
    previous = _current_index % len(_keys)
    _current_index = (_current_index + 1) % len(_keys)
    next_idx = _current_index % len(_keys)
    logger.warning("Groq key rotated from index %d to %d", previous, next_idx)
    return get_active_key()


def reset_keys() -> None:
    """Force reload of keys from environment (useful after env changes)."""
    global _keys, _current_index
    _keys = []
    _current_index = 0
