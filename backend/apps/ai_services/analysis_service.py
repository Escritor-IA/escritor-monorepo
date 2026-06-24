"""
Orchestrates all analysis types: validates credits, calls Groq, persists results.
Logic lives here — views just delegate to this service.
"""
import logging
import os

from apps.users.plans import get_plan_limits
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
    "general_context": 2,
    "total": 3,
    "book_general": 4,
    "book_total": 6,
    "creative_suggestion": 1,
}
READER_SIMULATION_CREDIT_PER_PROFILE = 1
BOOK_READER_SIMULATION_CREDIT_PER_PROFILE = 2

MAX_TOKENS_BY_TYPE = {
    "local": 2048,
    "local_context": 2048,
    "general_context": 3000,
    "total": 4096,
    "book_general": 3000,
    "book_total": 4096,
    "reader_simulation": 2048,
    "book_reader_simulation": 2048,
    "creative_suggestion": 1024,
}

_MANUSCRIPT_TOKEN_LIMIT = 40000  # chars, not tokens (~11K tokens)

_INSUFFICIENT_CREDITS: dict[str, str] = {
    "pt-br": "Créditos insuficientes. Necessário: {cost}, disponível: {available}.",
    "en": "Insufficient credits. Required: {cost}, available: {available}.",
    "fr": "Crédits insuffisants. Requis : {cost}, disponible : {available}.",
    "es": "Créditos insuficientes. Necesario: {cost}, disponible: {available}.",
}

_PLAN_BLOCKED: dict[str, str] = {
    "pt-br": "Este tipo de análise não está disponível no seu plano.",
    "en": "This analysis type is not available on your plan.",
    "fr": "Ce type d'analyse n'est pas disponible dans votre abonnement.",
    "es": "Este tipo de análisis no está disponible en tu plan.",
}

_PROFILES_BLOCKED: dict[str, str] = {
    "pt-br": "Perfis não disponíveis no seu plano: {profiles}.",
    "en": "Profiles not available on your plan: {profiles}.",
    "fr": "Profils non disponibles dans votre abonnement : {profiles}.",
    "es": "Perfiles no disponibles en tu plan: {profiles}.",
}

_WEEKLY_LIMIT: dict[str, str] = {
    "pt-br": "Você atingiu o limite de {limit} simulações de leitores por semana.",
    "en": "You have reached the limit of {limit} reader simulations per week.",
    "fr": "Vous avez atteint la limite de {limit} simulations de lecteurs par semaine.",
    "es": "Has alcanzado el límite de {limit} simulaciones de lectores por semana.",
}

_INVALID_PROFILES: dict[str, str] = {
    "pt-br": "Perfis de leitor inválidos: {profiles}.",
    "en": "Invalid reader profiles: {profiles}.",
    "fr": "Profils de lecteur invalides : {profiles}.",
    "es": "Perfiles de lector inválidos: {profiles}.",
}

_NO_PROFILES: dict[str, str] = {
    "pt-br": "Selecione ao menos um perfil de leitor.",
    "en": "Select at least one reader profile.",
    "fr": "Sélectionnez au moins un profil de lecteur.",
    "es": "Selecciona al menos un perfil de lector.",
}

_REQUIRES_CHAPTER: dict[str, dict[str, str]] = {
    "local": {
        "pt-br": "Análise local requer um capítulo selecionado.",
        "en": "Local analysis requires a selected chapter.",
        "fr": "L'analyse locale nécessite un chapitre sélectionné.",
        "es": "El análisis local requiere un capítulo seleccionado.",
    },
    "local_context": {
        "pt-br": "Análise narrativa requer um capítulo selecionado.",
        "en": "Narrative analysis requires a selected chapter.",
        "fr": "L'analyse narrative nécessite un chapitre sélectionné.",
        "es": "El análisis narrativo requiere un capítulo seleccionado.",
    },
    "general_context": {
        "pt-br": "Análise geral requer um capítulo selecionado.",
        "en": "General analysis requires a selected chapter.",
        "fr": "L'analyse générale nécessite un chapitre sélectionné.",
        "es": "El análisis general requiere un capítulo seleccionado.",
    },
    "total": {
        "pt-br": "Análise total requer um capítulo selecionado.",
        "en": "Total analysis requires a selected chapter.",
        "fr": "L'analyse totale nécessite un chapitre sélectionné.",
        "es": "El análisis total requiere un capítulo seleccionado.",
    },
    "reader_simulation": {
        "pt-br": "Simulação de leitor requer um capítulo selecionado.",
        "en": "Reader simulation requires a selected chapter.",
        "fr": "La simulation de lecteur nécessite un chapitre sélectionné.",
        "es": "La simulación de lector requiere un capítulo seleccionado.",
    },
    "creative_suggestion": {
        "pt-br": "Sugestão criativa requer um capítulo selecionado.",
        "en": "Creative suggestion requires a selected chapter.",
        "fr": "La suggestion créative nécessite un chapitre sélectionné.",
        "es": "La sugerencia creativa requiere un capítulo seleccionado.",
    },
}

_REQUIRES_SELECTION: dict[str, dict[str, str]] = {
    "local": {
        "pt-br": "Análise local requer um trecho selecionado no editor.",
        "en": "Local analysis requires a selected passage in the editor.",
        "fr": "L'analyse locale nécessite un passage sélectionné dans l'éditeur.",
        "es": "El análisis local requiere un pasaje seleccionado en el editor.",
    },
    "local_context": {
        "pt-br": "Análise narrativa requer um trecho selecionado no editor.",
        "en": "Narrative analysis requires a selected passage in the editor.",
        "fr": "L'analyse narrative nécessite un passage sélectionné dans l'éditeur.",
        "es": "El análisis narrativo requiere un pasaje seleccionado en el editor.",
    },
}

_EMPTY_CHAPTER: dict[str, str] = {
    "pt-br": "O capítulo está vazio. Adicione conteúdo antes de analisar.",
    "en": "The chapter is empty. Add content before analyzing.",
    "fr": "Le chapitre est vide. Ajoutez du contenu avant d'analyser.",
    "es": "El capítulo está vacío. Añade contenido antes de analizar.",
}

_NO_CHAPTERS: dict[str, str] = {
    "pt-br": "O projeto não possui capítulos para analisar.",
    "en": "The project has no chapters to analyze.",
    "fr": "Le projet n'a pas de chapitres à analyser.",
    "es": "El proyecto no tiene capítulos para analizar.",
}

_UNKNOWN_TYPE: dict[str, str] = {
    "pt-br": "Tipo de análise desconhecido: {type}.",
    "en": "Unknown analysis type: {type}.",
    "fr": "Type d'analyse inconnu : {type}.",
    "es": "Tipo de análisis desconocido: {type}.",
}


def _get_lang(user) -> str:
    return getattr(user, "preferred_language", "pt-br") or "pt-br"


def _truncate(text: str, max_chars: int = _MANUSCRIPT_TOKEN_LIMIT) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[Texto truncado para análise — manuscrito longo]"


def _enforce_plan_limits(user, analysis_type: str, reader_profiles: list, lang: str) -> None:
    plan_limits = get_plan_limits(user.user_plan.plan)

    if analysis_type in plan_limits["blocked_analysis_types"]:
        raise ValueError(_PLAN_BLOCKED.get(lang, _PLAN_BLOCKED["pt-br"]))

    if analysis_type in ("reader_simulation", "book_reader_simulation"):
        allowed = plan_limits["allowed_reader_profiles"]
        if allowed is not None:
            forbidden = [p for p in reader_profiles if p not in allowed]
            if forbidden:
                raise ValueError(
                    _PROFILES_BLOCKED.get(lang, _PROFILES_BLOCKED["pt-br"]).format(
                        profiles=", ".join(forbidden)
                    )
                )

        weekly_limit = plan_limits["reader_simulation_weekly_limit"]
        if weekly_limit is not None:
            used = user.user_plan.count_reader_simulations_this_week()
            if used >= weekly_limit:
                raise ValueError(
                    _WEEKLY_LIMIT.get(lang, _WEEKLY_LIMIT["pt-br"]).format(limit=weekly_limit)
                )


def run_analysis(user, project, chapter=None, analysis_type: str = "local", creative_request: str = "", reader_profiles: list = None, selected_text: str = "") -> dict:
    from apps.analyses.models import Analysis

    lang = _get_lang(user)
    _enforce_plan_limits(user, analysis_type, reader_profiles or [], lang)

    if analysis_type in ("reader_simulation", "book_reader_simulation"):
        profiles = reader_profiles or []
        invalid = [p for p in profiles if p not in READER_PROFILES]
        if invalid:
            raise ValueError(
                _INVALID_PROFILES.get(lang, _INVALID_PROFILES["pt-br"]).format(
                    profiles=", ".join(invalid)
                )
            )
        if not profiles:
            raise ValueError(_NO_PROFILES.get(lang, _NO_PROFILES["pt-br"]))
        rate = BOOK_READER_SIMULATION_CREDIT_PER_PROFILE if analysis_type == "book_reader_simulation" else READER_SIMULATION_CREDIT_PER_PROFILE
        cost = len(profiles) * rate
    else:
        cost = CREDIT_COSTS.get(analysis_type, 1)

    if user.user_plan.credits < cost:
        raise ValueError(
            _INSUFFICIENT_CREDITS.get(lang, _INSUFFICIENT_CREDITS["pt-br"]).format(
                cost=cost, available=user.user_plan.credits
            )
        )

    genres = project.genres
    model = os.environ.get("GROQ_MODEL", GROQ_MODEL)

    if analysis_type == "local":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["local"].get(lang, _REQUIRES_CHAPTER["local"]["pt-br"]))
        if not selected_text:
            raise ValueError(_REQUIRES_SELECTION["local"].get(lang, _REQUIRES_SELECTION["local"]["pt-br"]))
        messages = build_local_prompt(selected_text, genres, language=lang)

    elif analysis_type == "local_context":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["local_context"].get(lang, _REQUIRES_CHAPTER["local_context"]["pt-br"]))
        if not selected_text:
            raise ValueError(_REQUIRES_SELECTION["local_context"].get(lang, _REQUIRES_SELECTION["local_context"]["pt-br"]))
        index_chapter(chapter)
        context = retrieve_context(selected_text[:500], project, chapter=chapter)
        messages = build_local_prompt(selected_text, genres, context, language=lang)

    elif analysis_type == "general_context":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["general_context"].get(lang, _REQUIRES_CHAPTER["general_context"]["pt-br"]))
        if not chapter.content.strip():
            raise ValueError(_EMPTY_CHAPTER.get(lang, _EMPTY_CHAPTER["pt-br"]))
        index_chapter(chapter)
        context = retrieve_context(
            "estrutura narrativa desenvolvimento de personagens enredo consistência ritmo",
            project,
            chapter=chapter,
            top_k=20,
        )
        messages = build_general_context_prompt(context, genres, scope="chapter", language=lang)

    elif analysis_type == "total":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["total"].get(lang, _REQUIRES_CHAPTER["total"]["pt-br"]))
        if not chapter.content.strip():
            raise ValueError(_EMPTY_CHAPTER.get(lang, _EMPTY_CHAPTER["pt-br"]))
        messages = build_total_prompt(chapter.content, genres, language=lang)

    elif analysis_type == "book_general":
        index_project(project)
        context = retrieve_context(
            "estrutura narrativa desenvolvimento de personagens enredo consistência ritmo",
            project,
            top_k=20,
        )
        messages = build_general_context_prompt(context, genres, scope="book", language=lang)

    elif analysis_type == "book_total":
        chapters = list(project.chapters.order_by("number"))
        if not chapters:
            raise ValueError(_NO_CHAPTERS.get(lang, _NO_CHAPTERS["pt-br"]))
        full = "\n\n".join(
            f"=== Capítulo {c.number}: {c.title} ===\n{c.content}" for c in chapters
        )
        if len(full) > _MANUSCRIPT_TOKEN_LIMIT:
            logger.warning(
                "book_total truncated for project %s: %d -> %d chars",
                project.pk, len(full), _MANUSCRIPT_TOKEN_LIMIT,
            )
        messages = build_total_prompt(_truncate(full), genres, language=lang)

    elif analysis_type == "reader_simulation":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["reader_simulation"].get(lang, _REQUIRES_CHAPTER["reader_simulation"]["pt-br"]))
        results = {}
        for slug in profiles:
            messages = build_reader_profile_prompt(chapter.content, genres, slug, language=lang)
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
        user.user_plan.credits -= cost
        user.user_plan.save(update_fields=["credits"])
        logger.info("Analysis reader_simulation created for project %s, profiles=%s, %d credits deducted", project.pk, profiles, cost)
        return {"analysis": analysis, "credits_remaining": user.user_plan.credits}

    elif analysis_type == "book_reader_simulation":
        book_chapters = list(project.chapters.order_by("number"))
        if not book_chapters:
            raise ValueError(_NO_CHAPTERS.get(lang, _NO_CHAPTERS["pt-br"]))
        full = "\n\n".join(
            f"=== Capítulo {c.number}: {c.title} ===\n{c.content}" for c in book_chapters
        )
        if len(full) > _MANUSCRIPT_TOKEN_LIMIT:
            logger.warning(
                "book_reader_simulation truncated for project %s: %d -> %d chars",
                project.pk, len(full), _MANUSCRIPT_TOKEN_LIMIT,
            )
        book_text = _truncate(full)
        results = {}
        for slug in profiles:
            messages = build_reader_profile_prompt(book_text, genres, slug, language=lang)
            results[slug] = chat_completion(messages, model=model, max_tokens=MAX_TOKENS_BY_TYPE.get(analysis_type, 2048))

        import json
        analysis = Analysis.objects.create(
            project=project,
            chapter=None,
            analysis_type=analysis_type,
            reader_profiles=profiles,
            content=json.dumps(results, ensure_ascii=False),
            credits_consumed=cost,
            ai_model=model,
        )
        user.user_plan.credits -= cost
        user.user_plan.save(update_fields=["credits"])
        logger.info("Analysis book_reader_simulation created for project %s, profiles=%s, %d credits deducted", project.pk, profiles, cost)
        return {"analysis": analysis, "credits_remaining": user.user_plan.credits}

    elif analysis_type == "creative_suggestion":
        if not chapter:
            raise ValueError(_REQUIRES_CHAPTER["creative_suggestion"].get(lang, _REQUIRES_CHAPTER["creative_suggestion"]["pt-br"]))
        messages = build_creative_suggestion_prompt(chapter.content, genres, creative_request, language=lang)

    else:
        raise ValueError(
            _UNKNOWN_TYPE.get(lang, _UNKNOWN_TYPE["pt-br"]).format(type=analysis_type)
        )

    result_content = chat_completion(messages, model=model, max_tokens=MAX_TOKENS_BY_TYPE.get(analysis_type, 2048))

    analysis = Analysis.objects.create(
        project=project,
        chapter=chapter,
        analysis_type=analysis_type,
        content=result_content,
        credits_consumed=cost,
        ai_model=model,
    )

    user.user_plan.credits -= cost
    user.user_plan.save(update_fields=["credits"])

    logger.info("Analysis %s created for project %s, %d credits deducted", analysis_type, project.pk, cost)

    return {
        "analysis": analysis,
        "credits_remaining": user.user_plan.credits,
    }
