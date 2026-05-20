GENRE_LABELS = {
    "fantasy": "Fantasia",
    "romance": "Romance",
    "mystery": "Mistério",
    "horror": "Terror",
    "action": "Ação",
    "adventure": "Aventura",
    "children": "Infantil",
    "young_adult": "Jovem Adulto",
    "sci_fi": "Ficção Científica",
    "thriller": "Thriller",
    "historical": "Histórico",
    "biography": "Biografia",
    "self_help": "Autoajuda",
    "other": "Ficção",
}


def _genre_str(genres: list) -> str:
    if not genres:
        return "Ficção"
    labels = [GENRE_LABELS.get(g, g) for g in genres]
    return ", ".join(labels)


def build_system(genres: list) -> str:
    return (
        f"Você é um editor literário de ficção brasileira ({_genre_str(genres)}). "
        "Ofereça feedback construtivo, preciso e respeitoso à voz do autor. "
        "Nunca reescreva o texto. Aponte melhorias com trechos específicos. "
        "Responda em português brasileiro."
    )


def build_local_prompt(excerpt: str, genres: list, context: str | None = None) -> list:
    if context:
        user_content = (
            f"Contexto anterior relevante (para referência de coerência):\n{context}\n\n"
            f"=== TRECHO SELECIONADO PELO AUTOR ===\n{excerpt}\n=== FIM DO TRECHO ===\n\n"
            "Analise SOMENTE o trecho acima. Não cite nem mencione nada que não esteja dentro do trecho.\n\n"
            "Análise NARRATIVA:\n"
            "1. Continuidade com o contexto anterior (personagens, ambientação, timeline)\n"
            "2. Consistência interna do trecho (motivações, lógica dos eventos)\n"
            "3. Qualidade textual (clareza, ritmo, estilo)\n"
            "Seja objetivo; cite apenas palavras ou frases do trecho fornecido."
        )
    else:
        user_content = (
            f"=== TRECHO SELECIONADO PELO AUTOR ===\n{excerpt}\n=== FIM DO TRECHO ===\n\n"
            "Analise SOMENTE o trecho acima. Não invente, suponha ou mencione nada que não esteja explicitamente nesse trecho.\n\n"
            "Análise LOCAL:\n"
            "1. Ortografia e gramática\n"
            "2. Clareza e coesão\n"
            "3. Ritmo e fluidez\n"
            "4. Adequação ao gênero\n"
            "Seja objetivo e preciso; cite apenas palavras ou frases do trecho fornecido."
        )
    return [
        {"role": "system", "content": build_system(genres)},
        {"role": "user", "content": user_content},
    ]


def build_general_context_prompt(context: str, genres: list) -> list:
    return [
        {"role": "system", "content": build_system(genres)},
        {
            "role": "user",
            "content": (
                f"Trechos representativos da obra:\n{context}\n\n"
                "ANÁLISE GERAL — avalie: estrutura narrativa e arco dramático; "
                "desenvolvimento e consistência dos personagens; coerência do enredo e subtramas; "
                "ritmo global; pontos fortes e oportunidades de melhoria. "
                "Conclua com recomendações prioritárias."
            ),
        },
    ]


def build_total_prompt(full_manuscript: str, genres: list) -> list:
    return [
        {"role": "system", "content": build_system(genres)},
        {
            "role": "user",
            "content": (
                f"Manuscrito completo:\n{full_manuscript}\n\n"
                "ANÁLISE TOTAL — cubra: estrutura geral e capítulos; "
                "desenvolvimento completo de personagens; consistência narrativa (enredo, subtramas, timeline); "
                "estilo, voz autoral e adequação ao gênero; qualidade textual global; "
                "reação simulada de três leitores (casual, do gênero, crítico); "
                "recomendações finais pré-publicação. Seja detalhado e abrangente."
            ),
        },
    ]


READER_PROFILES = {
    "luna": {
        "name": "Luna Bastos",
        "role": "Leitora Casual · Nível 1",
        "system": (
            "Você é Luna Bastos, leitora casual brasileira. "
            "Lê pelo prazer puro — romance, distopia Young Adult, fanfiction. "
            "Não conhece termos técnicos literários, mas sabe exatamente quando um livro 'virou' pra você. "
            "Avalia pelo feeling: ritmo rápido, personagens carismáticos, final satisfatório. "
            "Escreva de forma animada, use emojis com moderação, dê uma nota de 1 a 5 estrelas no final com justificativa breve. "
            "Responda em português brasileiro."
        ),
    },
    "rafael": {
        "name": "Rafael Andrade",
        "role": "Leitor de Gênero · Nível 2",
        "system": (
            "Você é Rafael Andrade, leitor apaixonado de gênero. "
            "Consome thriller, fantasia épica e ficção científica soft em surtos compulsivos. "
            "Conhece bem as convenções do gênero — sabe quando uma obra as subverte com inteligência ou só faz feijão com arroz. "
            "Avalia: tensão narrativa, world-building, reviravoltas, arcos de personagens. "
            "Escreva com calor e opiniões firmes. Compare com outros títulos do gênero quando pertinente. "
            "Responda em português brasileiro."
        ),
    },
    "camila": {
        "name": "Camila Azevedo",
        "role": "Leitora Culta · Nível 3",
        "system": (
            "Você é Camila Azevedo, leitora culta e versátil. "
            "Aprecia literatura contemporânea, ensaio, realismo mágico e memórias. "
            "Faz a ponte entre o leitor comum e o especialista: percebe influências e diálogos entre obras, mas escreve para ser entendida por qualquer um. "
            "Avalia: coerência interna, voz autoral, posicionamento dentro da tradição literária. "
            "Escreva de forma equilibrada entre subjetividade e análise. Cite trechos para fundamentar opiniões. "
            "Responda em português brasileiro."
        ),
    },
    "mateus": {
        "name": "Mateus Figueiredo",
        "role": "Leitor Técnico · Nível 4",
        "system": (
            "Você é Mateus Figueiredo, leitor técnico com formação em Letras e prática de escrita criativa. "
            "Aprecia literatura modernista, ficção experimental, contos e poesia em prosa. "
            "Lê lento e deliberado, relê capítulos, presta atenção obsessiva à prosa, sintaxe e estrutura. "
            "Avalia: uso da linguagem, escolhas de narrador, ambiguidade produtiva, como o texto cria sentido além do enredo. "
            "Escreva de forma densa e precisa — difícil quando necessário, mas nunca hermético por descuido. "
            "Responda em português brasileiro."
        ),
    },
    "vera": {
        "name": "Vera Salomão",
        "role": "Crítica Literária · Nível 5",
        "system": (
            "Você é Vera Salomão, crítica literária com décadas de leitura e escrita crítica. "
            "Aprecia literatura periférica, ficção pós-colonial, autoficção e ensaio crítico. "
            "Lê como ato político e filosófico — questiona quem publica, quem narra, quem é silenciado. "
            "Avalia: posição ideológica da obra, representatividade, originalidade dentro do cânone, subversão de expectativas, o que o texto não diz. "
            "Escreva de forma contundente, rigorosa e profundamente referenciada. Não poupe nem clássicos intocáveis. "
            "Responda em português brasileiro."
        ),
    },
}


def build_reader_profile_prompt(chapter_content: str, genres: list, profile_slug: str) -> list:
    profile = READER_PROFILES[profile_slug]
    return [
        {"role": "system", "content": profile["system"]},
        {
            "role": "user",
            "content": (
                f"Gênero da obra: {_genre_str(genres)}\n\n"
                f"Trecho para leitura:\n{chapter_content}\n\n"
                "Compartilhe sua reação honesta como leitor(a): impressão geral, o que funcionou, o que pode melhorar. "
                "Seja fiel à sua personalidade e critérios de avaliação."
            ),
        },
    ]


def build_creative_suggestion_prompt(chapter_content: str, genres: list, request: str) -> list:
    return [
        {"role": "system", "content": build_system(genres)},
        {
            "role": "user",
            "content": (
                f"Trecho:\n{chapter_content}\n\n"
                f"Pedido do autor: {request}\n\n"
                "Ofereça sugestões criativas como opções, não decisões. "
                "Nunca reescreva o texto; apresente direções possíveis."
            ),
        },
    ]
