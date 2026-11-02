import pytest

from apps.ai_services import prompts
from apps.ai_services.prompts import (
    READER_PROFILES,
    build_creative_suggestion_prompt,
    build_general_context_prompt,
    build_local_prompt,
    build_reader_profile_prompt,
    build_system,
    build_total_prompt,
)

LANGS = ["pt-br", "en", "fr", "es"]
OUTPUT_RULES_MARKER = "## "


def _system_of(messages):
    return next(m["content"] for m in messages if m["role"] == "system")


def _user_of(messages):
    return next(m["content"] for m in messages if m["role"] == "user")


@pytest.mark.parametrize("lang", LANGS)
def test_build_system_appends_output_rules(lang):
    system = build_system(["fantasy"], lang)
    assert system.endswith(prompts._OUTPUT_RULES[lang])
    assert OUTPUT_RULES_MARKER in system


@pytest.mark.parametrize("lang", LANGS)
def test_every_analysis_prompt_carries_output_rules(lang):
    rules = prompts._OUTPUT_RULES[lang]
    builders = [
        build_local_prompt("trecho", ["fantasy"], language=lang),
        build_local_prompt("trecho", ["fantasy"], "contexto", language=lang),
        build_general_context_prompt("ctx", ["fantasy"], scope="chapter", language=lang),
        build_general_context_prompt("ctx", ["fantasy"], scope="book", language=lang),
        build_total_prompt("texto", ["fantasy"], language=lang),
        build_creative_suggestion_prompt("texto", ["fantasy"], "ideias", language=lang),
    ]
    for messages in builders:
        assert rules in _system_of(messages)


@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("slug", list(READER_PROFILES))
def test_reader_profile_prompt_carries_output_rules(lang, slug):
    messages = build_reader_profile_prompt("texto", ["fantasy"], slug, language=lang)
    assert prompts._OUTPUT_RULES[lang] in _system_of(messages)


@pytest.mark.parametrize("lang", LANGS)
@pytest.mark.parametrize("scope", ["chapter", "book"])
def test_general_context_user_prompt_does_not_mention_rag(lang, scope):
    user = _user_of(build_general_context_prompt("ctx-body", ["fantasy"], scope=scope, language=lang))
    assert "RAG" not in user
    assert "ctx-body" in user


def test_general_context_does_not_receive_chapter_twice():
    user = _user_of(build_general_context_prompt("UNICO-TRECHO", [], scope="chapter"))
    assert user.count("UNICO-TRECHO") == 1


@pytest.mark.parametrize("lang,user_phrase,system_phrase", [
    ("pt-br", "Nunca reescreva", "Nunca reescreva"),
    ("en", "Never rewrite", "Never rewrite"),
    ("fr", "Ne réécrivez jamais", "Ne jamais réécrire"),
    ("es", "Nunca reescribas", "Nunca reescribas"),
])
def test_creative_suggestion_still_forbids_rewriting(lang, user_phrase, system_phrase):
    messages = build_creative_suggestion_prompt("t", [], "r", language=lang)
    assert user_phrase in _user_of(messages)
    assert system_phrase in _system_of(messages)


def test_unsupported_language_falls_back_to_pt_br_rules():
    assert prompts.with_output_rules("x", "de") == "x" + prompts._OUTPUT_RULES["pt-br"]
