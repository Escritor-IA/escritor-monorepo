"""
Orchestrates all analysis types: validates credits, calls Groq, persists results.
Logic lives here — views just delegate to this service.
"""
import logging
import os

from .groq_client import chat_completion, GROQ_MODEL
from .rag import index_chapter, index_project, retrieve_context
from .prompts import (
    build_local_prompt,
    build_general_context_prompt,
    build_total_prompt,
    build_reader_profile_prompt,
    build_creative_suggestion_prompt,
    READER_PROFILES,
)

logger = logging.getLogger(__name__)

CREDIT_COSTS = {
    "local": 1,
    "local_context": 2,
    "general_context": 3,
    "total": 5,
    "creative_suggestion": 1,
}
READER_SIMULATION_CREDIT_PER_PROFILE = 1

MAX_TOKENS_BY_TYPE = {
    "local": 2048,
    "local_context": 2048,
    "general_context": 3000,
    "total": 4096,
    "reader_simulation": 2048,
    "creative_suggestion": 1024,
}

_MANUSCRIPT_TOKEN_LIMIT = 12000  # chars, not tokens — safe limit for Groq context


def _truncate(text: str, max_chars: int = _MANUSCRIPT_TOKEN_LIMIT) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[Texto truncado para análise — manuscrito longo]"


def run_analysis(user, project, chapter=None, analysis_type: str = "local", creative_request: str = "", reader_profiles: list = None, selected_text: str = "") -> dict:
    from apps.analyses.models import Analysis

    if analysis_type == "reader_simulation":
        profiles = reader_profiles or []
        invalid = [p for p in profiles if p not in READER_PROFILES]
        if invalid:
            raise ValueError(f"Perfis de leitor inválidos: {', '.join(invalid)}.")
        if not profiles:
            raise ValueError("Selecione ao menos um perfil de leitor.")
        cost = len(profiles) * READER_SIMULATION_CREDIT_PER_PROFILE
    else:
        cost = CREDIT_COSTS.get(analysis_type, 1)

    if user.credits_balance < cost:
        raise ValueError(f"Créditos insuficientes. Necessário: {cost}, disponível: {user.credits_balance}.")

    genres = project.genres
    model = os.environ.get("GROQ_MODEL", GROQ_MODEL)

    if analysis_type == "local":
        if not chapter:
            raise ValueError("Análise local requer um capítulo selecionado.")
        if not selected_text:
            raise ValueError("Análise local requer um trecho selecionado no editor.")
        messages = build_local_prompt(selected_text, genres)

    elif analysis_type == "local_context":
        if not chapter:
            raise ValueError("Análise narrativa requer um capítulo selecionado.")
        if not selected_text:
            raise ValueError("Análise narrativa requer um trecho selecionado no editor.")
        index_chapter(chapter)
        context = retrieve_context(selected_text[:500], project)
        messages = build_local_prompt(selected_text, genres, context)

    elif analysis_type == "general_context":
        index_project(project)
        context = retrieve_context(
            "estrutura narrativa desenvolvimento de personagens enredo consistência ritmo",
            project,
            top_k=12,
        )
        messages = build_general_context_prompt(context, genres)

    elif analysis_type == "total":
        chapters = list(project.chapters.order_by("number"))
        full = "\n\n".join(
            f"=== Capítulo {c.number}: {c.title} ===\n{c.content}" for c in chapters
        )
        messages = build_total_prompt(_truncate(full), genres)

    elif analysis_type == "reader_simulation":
        if not chapter:
            raise ValueError("Simulação de leitor requer um capítulo selecionado.")
        results = {}
        for slug in profiles:
            messages = build_reader_profile_prompt(chapter.content, genres, slug)
            results[slug] = chat_completion(messages, model=model, max_tokens=MAX_TOKENS_BY_TYPE.get(analysis_type, 2048))

        import json
        analysis = Analysis.objects.create(
            project=project,
            chapter=chapter,
            analysis_type=analysis_type,
            reader_profiles=profiles,
            content=json.dumps(results, ensure_ascii=False),
            credits_consumed=cost,
            ai_model=model,
        )
        user.credits_balance -= cost
        user.save(update_fields=["credits_balance"])
        logger.info("Analysis reader_simulation created for project %s, profiles=%s, %d credits deducted", project.pk, profiles, cost)
        return {"analysis": analysis, "credits_remaining": user.credits_balance}

    elif analysis_type == "creative_suggestion":
        if not chapter:
            raise ValueError("Sugestão criativa requer um capítulo selecionado.")
        messages = build_creative_suggestion_prompt(chapter.content, genres, creative_request)

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

    logger.info("Analysis %s created for project %s, %d credits deducted", analysis_type, project.pk, cost)

    return {
        "analysis": analysis,
        "credits_remaining": user.credits_balance,
    }
