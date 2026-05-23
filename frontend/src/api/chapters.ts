import client from "./client";
import type { Chapter } from "@/types";

export const chaptersApi = {
  list: (projectId: string) =>
    client.get<Chapter[]>(`/projects/${projectId}/chapters/`), // pagination_class = None no backend

  get: (id: string) => client.get<Chapter>(`/chapters/${id}/`),

  create: (projectId: string, data: Pick<Chapter, "number" | "title" | "content">) =>
    client.post<Chapter>(`/projects/${projectId}/chapters/`, {
      ...data,
      project: projectId,
    }),

  update: (id: string, data: Partial<Pick<Chapter, "title" | "content" | "number">>) =>
    client.patch<Chapter>(`/chapters/${id}/`, data),

  delete: (id: string) => client.delete(`/chapters/${id}/`),

  import: (projectId: string, file: File, chapterTitle?: string) => {
    const form = new FormData();
    form.append("project_id", projectId);
    form.append("file", file);
    if (chapterTitle) form.append("chapter_title", chapterTitle);
    return client.post<Chapter>("/chapters/import/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
