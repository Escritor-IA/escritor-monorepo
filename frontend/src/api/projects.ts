import client from "./client";
import type { Project } from "@/types";

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export const projectsApi = {
  list: () => client.get<PaginatedResponse<Project>>("/projects/"),

  get: (id: string) => client.get<Project>(`/projects/${id}/`),

  create: (data: Pick<Project, "title" | "genres" | "synopsis" | "status">) =>
    client.post<Project>("/projects/", data),

  update: (id: string, data: Partial<Pick<Project, "title" | "genres" | "synopsis" | "status">>) =>
    client.patch<Project>(`/projects/${id}/`, data),

  delete: (id: string) => client.delete(`/projects/${id}/`),
};
