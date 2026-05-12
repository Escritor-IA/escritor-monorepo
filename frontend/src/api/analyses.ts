import client from "./client";
import type { Analysis, AnalysisType } from "@/types";

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

interface RunAnalysisPayload {
  project_id: number;
  chapter_id?: number | null;
  analysis_type: AnalysisType;
  creative_request?: string;
}

interface RunAnalysisResponse {
  analysis: Analysis;
  credits_remaining: number;
}

export const analysesApi = {
  list: (params?: { project?: number; chapter?: number }) =>
    client.get<PaginatedResponse<Analysis>>("/analyses/", { params }),

  get: (id: number) => client.get<Analysis>(`/analyses/${id}/`),

  run: (payload: RunAnalysisPayload) =>
    client.post<RunAnalysisResponse>("/analyses/run/", payload),

  delete: (id: number) => client.delete(`/analyses/${id}/`),
};
