export interface UserPlan {
  plan: "free" | "basic" | "premium";
  credits: number;
  billing_cycle: "monthly" | "annual" | null;
  expires_at: string | null;
  currency: "brl" | "usd" | "eur";
}

export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  user_plan: UserPlan;
  date_joined: string;
  preferred_language: "pt-br" | "en" | "fr" | "es";
  avatar_url: string | null;
}

export type ProjectGenre =
  | "fantasy"
  | "romance"
  | "mystery"
  | "horror"
  | "action"
  | "adventure"
  | "children"
  | "young_adult"
  | "sci_fi"
  | "thriller"
  | "historical"
  | "biography"
  | "self_help"
  | "other";

export type ProjectStatus = "in_progress" | "archived";

export interface Project {
  id: string;
  title: string;
  genres: string[];
  synopsis: string;
  status: ProjectStatus;
  chapters_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  project: string;
  number: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type AnalysisType =
  | "local"
  | "local_context"
  | "general_context"
  | "total"
  | "reader_simulation"
  | "creative_suggestion"
  | "book_general"
  | "book_total"
  | "book_reader_simulation";

export interface Analysis {
  id: string;
  project: string;
  chapter: string | null;
  chapter_title: string | null;
  analysis_type: AnalysisType;
  analysis_type_display: string;
  reader_profiles: string[];
  content: string;
  credits_consumed: number;
  ai_model: string;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export const GENRE_LABELS: Record<ProjectGenre, string> = {
  fantasy: "Fantasia",
  romance: "Romance",
  mystery: "Mistério",
  horror: "Terror",
  action: "Ação",
  adventure: "Aventura",
  children: "Infantil",
  young_adult: "Jovem Adulto",
  sci_fi: "Ficção Científica",
  thriller: "Thriller",
  historical: "Histórico",
  biography: "Biografia",
  self_help: "Autoajuda",
  other: "Outro",
};

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  local: "Análise Local (1 crédito)",
  local_context: "Análise Narrativa (2 créditos)",
  general_context: "Análise Geral do Capítulo (2 créditos)",
  total: "Análise Total do Capítulo (3 créditos)",
  reader_simulation: "Simulação de Leitores (1 cr./perfil)",
  creative_suggestion: "Sugestão Criativa (1 crédito)",
  book_general: "Análise Geral do Livro (4 créditos)",
  book_total: "Análise Total do Livro (6 créditos)",
  book_reader_simulation: "Simulação de Leitores — Livro (2 cr./perfil)",
};

export const ANALYSIS_COSTS: Record<AnalysisType, number> = {
  local: 1,
  local_context: 2,
  general_context: 2,
  total: 3,
  reader_simulation: 1,
  creative_suggestion: 1,
  book_general: 4,
  book_total: 6,
  book_reader_simulation: 2,
};

export const PLAN_LABELS: Record<"free" | "basic" | "premium", string> = {
  free: "Rascunho",
  basic: "Autor",
  premium: "Obra Completa",
};

// Minimum plan required to run each analysis type (absence = free)
export const ANALYSIS_MIN_PLAN: Partial<Record<AnalysisType, "basic" | "premium">> = {
  total: "basic",
  book_total: "basic",
};

// Minimum plan required per reader profile slug
export const PROFILE_MIN_PLAN: Record<string, "free" | "basic" | "premium"> = {
  luna: "free",
  rafael: "basic",
  camila: "basic",
  mateus: "premium",
  vera: "premium",
  heitor: "premium",
};
