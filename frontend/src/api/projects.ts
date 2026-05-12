import client from "./client";
import type { Project } from "@/types";

interface PaginatedResponse<T> {
  results: T[];
  count: number;
}

export const projectsApi = {
  list: () => client.get<PaginatedResponse<Project>>("/projects/"),

  get: (id: number) => client.get<Project>(`/projects/${id}/`),

  create: (data: Pick<Project, "title" | "genre" | "synopsis" | "status">) =>
    client.post<Project>("/projects/", data),

  update: (id: number, data: Partial<Pick<Project, "title" | "genre" | "synopsis" | "status">>) =>
    client.patch<Project>(`/projects/${id}/`, data),

  delete: (id: number) => client.delete(`/projects/${id}/`),
};
