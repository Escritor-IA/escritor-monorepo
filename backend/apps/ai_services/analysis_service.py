"""
Orchestrates all analysis types: validates credits, calls Groq, persists results.
Logic lives here — views just delegate to this service.
"""
import logging
import os

from .groq_client import chat_completion, GROQ_MODEL
from .rag import index_chapter, retrieve_context
from .prompts import (
    build_local_prompt,
    build_local_context_prompt,
    build_general_prompt,
    build_total_prompt,
    build_reader_simulation_prompt,
    build_creative_suggestion_prompt,
)

logger = logging.getLogger(__name__)

CREDIT_COSTS = {
    "local": 1,
    "local_context": 2,
    "general": 3,
    "total": 5,
    "reader_simulation": 2,
    "creative_suggestion": 1,
}

MAX_TOKENS_BY_TYPE = {
    "local": 2048,
    "local_context": 2048,
    "general": 3000,
    "total": 4096,
    "reader_simulation": 2048,
    "creative_suggestion": 1024,
}

_MANUSCRIPT_TOKEN_LIMIT = 12000  # chars, not tokens — safe limit for Groq context


def _truncate(text: str, max_chars: int = _MANUSCRIPT_TOKEN_LIMIT) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[Texto truncado para análise — manuscrito longo]"


def run_analysis(user, project, chapter=None, analysis_type: str = "local", creative_request: str = "") -> dict:
    from apps.analyses.models import Analysis

    cost = CREDIT_COSTS.get(analysis_type, 1)
    if user.credits_balance < cost:
        raise ValueError(f"Créditos insuficientes. Necessário: {cost}, disponível: {user.credits_balance}.")

    genre = project.genre
    model = os.environ.get("GROQ_MODEL", GROQ_MODEL)

    if analysis_type == "local":
        if not chapter:
            raise ValueError("Análise local requer um capítulo selecionado.")
        messages = build_local_prompt(chapter.content, genre)

    elif analysis_type == "local_context":
        if not chapter:
            raise ValueError("Análise local com contexto requer um capítulo selecionado.")
        index_chapter(chapter)
        context = retrieve_context(chapter.content[:500], project)
        messages = build_local_context_prompt(chapter.content, genre, context)

    elif analysis_type == "general":
        chapters = list(project.chapters.order_by("number"))
        summary = "\n\n".join(
            f"[Capítulo {c.number} — {c.title}]\n{c.content[:1000]}" for c in chapters
        )
        messages = build_general_prompt(_truncate(summary), genre)

    elif analysis_type == "total":
        chapters = list(project.chapters.order_by("number"))
        full = "\n\n".join(
            f"=== Capítulo {c.number}: {c.title} ===\n{c.content}" for c in chapters
        )
        messages = build_total_prompt(_truncate(full), genre)

    elif analysis_type == "reader_simulation":
        if not chapter:
            raise ValueError("Simulação de leitor requer um capítulo selecionado.")
        messages = build_reader_simulation_prompt(chapter.content, genre)

    elif analysis_type == "creative_suggestion":
        if not chapter:
            raise ValueError("Sugestão criativa requer um capítulo selecionado.")
        messages = build_creative_suggestion_prompt(chapter.content, genre, creative_request)

    else:
        raise ValueError(f"Tipo de análise desconhecido: {analysis_type}")

    result_content = chat_completion(messages, model=model, max_tokens=MAX_TOKENS_BY_TYPE.get(analysis_type, 2048))

    analysis = Analysis.objects.create(
        project=project,
        chapter=chapter,
        analysis_type=analysis_type,
        content=result_content,
        credits_consumed=cost,
        ai_model=model,
    )

    user.credits_balance -= cost
    user.save(update_fields=["credits_balance"])

    logger.info("Analysis %s created for project %d, %d credits deducted", analysis_type, project.pk, cost)

    return {
        "analysis": analysis,
        "credits_remaining": user.credits_balance,
    }
