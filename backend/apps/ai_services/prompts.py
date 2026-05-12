"""
Structured prompt templates for each analysis type.

All prompts are in Brazilian Portuguese and calibrated by literary genre.
"""

GENRE_LABELS = {
    "fantasy": "Fantasia",
    "romance": "Romance",
    "mystery": "Mistério",
    "horror": "Terror",
    "action": "Ação",
    "adventure": "Aventura",
    "children": "Infantil",
    "young_adult": "Jovem Adulto",
    "other": "Ficção",
}

SYSTEM_BASE = (
    "Você é um editor literário especializado em ficção brasileira. "
    "Seu papel é oferecer feedback construtivo, preciso e respeitoso à voz do autor. "
    "Nunca reescreva o texto do autor. Aponte pontos de melhoria com exemplos específicos. "
    "Responda sempre em português brasileiro."
)


def build_local_prompt(chapter_content: str, genre: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Capítulo para análise:\n{chapter_content}\n\n"
                "Realize uma análise LOCAL deste capítulo, abordando:\n"
                "1. Ortografia e gramática\n"
                "2. Clareza e coesão\n"
                "3. Ritmo e fluidez da prosa\n"
                "4. Estilo adequado ao gênero\n"
                "Seja objetivo e aponte trechos específicos quando relevante."
            ),
        },
    ]


def build_local_context_prompt(chapter_content: str, genre: str, context: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Contexto recuperado da obra (trechos anteriores relevantes):\n{context}\n\n"
                f"Capítulo atual:\n{chapter_content}\n\n"
                "Realize uma análise LOCAL COM CONTEXTO, avaliando:\n"
                "1. Continuidade narrativa em relação ao contexto anterior\n"
                "2. Consistência de personagens e motivações\n"
                "3. Coerência de ambientação e linha do tempo\n"
                "4. Qualidade textual (ortografia, ritmo, estilo)\n"
                "Aponte inconsistências ou pontos de melhoria com referências ao contexto."
            ),
        },
    ]


def build_general_prompt(all_chapters_summary: str, genre: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Resumo/conteúdo da obra:\n{all_chapters_summary}\n\n"
                "Realize uma ANÁLISE GERAL DA OBRA, avaliando:\n"
                "1. Estrutura narrativa e arco dramático\n"
                "2. Desenvolvimento e consistência dos personagens\n"
                "3. Coerência do enredo e das subtramas\n"
                "4. Ritmo global da narrativa\n"
                "5. Pontos fortes e oportunidades de melhoria\n"
                "Ofereça um panorama completo com recomendações prioritárias."
            ),
        },
    ]


def build_total_prompt(full_manuscript: str, genre: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Manuscrito completo:\n{full_manuscript}\n\n"
                "Realize uma ANÁLISE TOTAL DO MANUSCRITO, cobrindo:\n"
                "1. Estrutura geral e divisão em capítulos\n"
                "2. Desenvolvimento completo de personagens\n"
                "3. Consistência narrativa (enredo, subtramas, timeline)\n"
                "4. Estilo, voz autoral e adequação ao gênero\n"
                "5. Qualidade textual global\n"
                "6. Simulação de reação de três perfis de leitor: leitor casual, "
                "leitor do gênero e leitor crítico\n"
                "7. Recomendações finais antes da publicação\n"
                "Esta é a análise mais completa — seja detalhado e abrangente."
            ),
        },
    ]


def build_reader_simulation_prompt(chapter_content: str, genre: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Trecho:\n{chapter_content}\n\n"
                "Simule a reação de três perfis de leitor ao ler este trecho:\n"
                "1. Leitor Casual: alguém que lê por entretenimento, sem experiência crítica\n"
                "2. Leitor do Gênero: fã experiente do gênero, que conhece as convenções\n"
                "3. Leitor Crítico: editor ou crítico literário profissional\n\n"
                "Para cada perfil, descreva: impressão geral, o que funcionou, o que poderia melhorar."
            ),
        },
    ]


def build_creative_suggestion_prompt(chapter_content: str, genre: str, request: str) -> list:
    genre_label = GENRE_LABELS.get(genre, "Ficção")
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {
            "role": "user",
            "content": (
                f"Gênero literário: {genre_label}\n\n"
                f"Trecho atual:\n{chapter_content}\n\n"
                f"Solicitação do autor: {request}\n\n"
                "Ofereça sugestões criativas para ajudar o autor. "
                "Apresente opções, não decisões — o autor escolhe o caminho. "
                "Nunca reescreva o texto; apresente possibilidades e direções."
            ),
        },
    ]
