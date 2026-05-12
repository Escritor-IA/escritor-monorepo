export interface User {
  id: number;
  username: string;
  email: string;
  profile: "beginner" | "experienced";
  credits_balance: number;
  plan: "free" | "basic" | "premium";
  date_joined: string;
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
  | "other";

export type ProjectStatus = "in_progress" | "completed" | "paused";

export interface Project {
  id: number;
  title: string;
  genre: ProjectGenre;
  synopsis: string;
  status: ProjectStatus;
  chapters_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  project: number;
  number: number;
  title: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export type AnalysisType =
  | "local"
  | "local_context"
  | "general"
  | "total"
  | "reader_simulation"
  | "creative_suggestion";

export interface Analysis {
  id: number;
  project: number;
  chapter: number | null;
  chapter_title: string | null;
  analysis_type: AnalysisType;
  analysis_type_display: string;
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
  other: "Outro",
};

export const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  local: "Análise Local (1 crédito)",
  local_context: "Análise com Contexto (2 créditos)",
  general: "Análise Geral (3 créditos)",
  total: "Análise Total (5 créditos)",
  reader_simulation: "Simulação de Leitores (2 créditos)",
  creative_suggestion: "Sugestão Criativa (1 crédito)",
};

export const ANALYSIS_COSTS: Record<AnalysisType, number> = {
  local: 1,
  local_context: 2,
  general: 3,
  total: 5,
  reader_simulation: 2,
  creative_suggestion: 1,
};
