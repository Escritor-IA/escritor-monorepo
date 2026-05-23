import client from "./client";
import type { Analysis, AnalysisType } from "@/types";

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

interface RunAnalysisPayload {
  project_id: string;
  chapter_id?: string | null;
  analysis_type: AnalysisType;
  creative_request?: string;
  reader_profiles?: string[];
  selected_text?: string;
}

interface RunAnalysisResponse {
  analysis: Analysis;
  credits_remaining: number;
}

export const analysesApi = {
  list: (params?: { project?: string; chapter?: string }) =>
    client.get<PaginatedResponse<Analysis>>("/analyses/", { params }),

  get: (id: string) => client.get<Analysis>(`/analyses/${id}/`),

  run: (payload: RunAnalysisPayload) =>
    client.post<RunAnalysisResponse>("/analyses/run/", payload),

  delete: (id: string) => client.delete(`/analyses/${id}/`),
};
