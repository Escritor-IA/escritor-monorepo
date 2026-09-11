# Escritor.IA

Plataforma SaaS de assistência editorial para escritores de ficção brasileiros.  
A IA analisa, sugere e simula leitores — sem jamais reescrever o texto do autor.

**Stack:** Django 4.2 · PostgreSQL + pgvector · Groq (LLaMA 4) · React 18 · TypeScript · Vite · TipTap

---

## Estrutura do repositório

```
escritor-monorepo/
├── backend/    # API REST (Django + DRF)
├── frontend/   # App web dos escritores (React + Vite, porta 5173)
└── landing/    # Página de marketing (React + Vite, porta 5174)
```

---

## Pré-requisitos

- Python 3.12+
- Node.js 20+
- PostgreSQL com a extensão **pgvector** habilitada

---

## Backend

### 1. Ambiente

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Variáveis de ambiente

Crie um arquivo `.env` dentro de `backend/`:

```env
SECRET_KEY=troque-em-producao
DEBUG=True

POSTGRES_DB=escritoria
POSTGRES_USER=escritoria
POSTGRES_PASSWORD=escritoria
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

EMAIL_HOST_USER=seu@gmail.com
EMAIL_HOST_PASSWORD=senha-de-app-do-gmail

# Uma ou mais chaves Groq (rotação automática em caso de cota esgotada)
GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...   # opcional

# Modelo padrão (pode omitir para usar o padrão)
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Banco de dados

```bash
# Certifique-se de que a extensão pgvector está ativa no PostgreSQL:
# CREATE EXTENSION IF NOT EXISTS vector;

python manage.py migrate
```

### 4. Rodar

```bash
python manage.py runserver
# API disponível em http://localhost:8000/api/
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
# Disponível em http://localhost:5173
```

O Vite já está configurado para fazer proxy de `/api/*` para `http://localhost:8000`.

---

## Landing Page

```bash
cd landing
npm install
npm run dev
# Disponível em http://localhost:5174
```

Para apontar os CTAs para o frontend correto, crie um `.env` em `landing/`:

```env
VITE_APP_URL=http://localhost:5173
```

---

## Testes (Backend)

Os testes usam **pytest-django** e um mock de Groq (nenhuma chamada real de IA é feita).

```bash
cd backend

# Todos os testes
pytest

# Verbose com saída detalhada
pytest -v

# Apenas um arquivo
pytest tests/test_auth.py
pytest tests/test_analyses.py
pytest tests/test_projects.py
pytest tests/test_chapters.py

# Apenas um teste específico
pytest tests/test_auth.py::test_login_returns_tokens
```

### Testes de planos e créditos

Os cenários de regras de negócio ficam centralizados em `tests/fixtures.py`.  
Você pode rodá-los isoladamente pelas marcações de parametrize:

```bash
# Limites de palavras por capítulo (free 5k / basic 15k / premium ilimitado)
pytest tests/test_chapters.py -k "word_limit"

# Acesso a tipos de análise por plano (ex: free bloqueia "total" e "book_total")
pytest tests/test_analyses.py -k "analysis_type"

# Acesso a perfis de leitores por plano
pytest tests/test_analyses.py -k "reader_profile"

# Dedução e saldo de créditos após análise
pytest tests/test_analyses.py -k "credit"

# Limite semanal de simulações de leitores (free: 2/semana)
pytest tests/test_analyses.py -k "weekly"

# Comportamento ao ficar sem créditos
pytest tests/test_analyses.py -k "insufficient_credits"
```

#### Cenários cobertos em `tests/fixtures.py`

| Fixture | O que testa |
|---|---|
| `PLAN_CREDITS` | Créditos iniciais por plano (free=10, basic=60, premium=150) |
| `CHAPTER_WORD_LIMIT_CASES` | Limites de palavras por capítulo por plano |
| `ANALYSIS_TYPE_PLAN_CASES` | Quais tipos de análise cada plano pode rodar |
| `PAID_PLAN_PREMIUM_TYPE_CASES` | Tipos premium acessíveis por basic e premium |
| `READER_PROFILE_CASES` | Quais perfis de leitores cada plano pode usar |
| `CREDIT_BALANCE_CASES` | Saldo de créditos depois de uma análise de 1 crédito |

---

## Endpoints principais

| Recurso | Rota base |
|---|---|
| Autenticação | `/api/auth/` |
| Projetos | `/api/projects/` |
| Capítulos | `/api/chapters/` / `/api/projects/<id>/chapters/` |
| Análises | `/api/analyses/` |
| Admin Django | `/admin/` |

---

## Planos

| | Rascunho (free) | Autor (basic) | Obra Completa (premium) |
|---|---|---|---|
| Créditos/mês | 10 | 60 | 150 |
| Palavras/capítulo | 5.000 | 15.000 | Ilimitado |
| Perfis de leitor | 1 (Luna) | 3 | 6 |
| Simulações/semana | 2 | Ilimitado | Ilimitado |
