import client from "./client";
import type { Chapter } from "@/types";

export const chaptersApi = {
  list: (projectId: number) =>
    client.get<Chapter[]>(`/projects/${projectId}/chapters/`), // pagination_class = None no backend

  get: (id: number) => client.get<Chapter>(`/chapters/${id}/`),

  create: (projectId: number, data: Pick<Chapter, "number" | "title" | "content">) =>
    client.post<Chapter>(`/projects/${projectId}/chapters/`, {
      ...data,
      project: projectId,
    }),

  update: (id: number, data: Partial<Pick<Chapter, "title" | "content" | "number">>) =>
    client.patch<Chapter>(`/chapters/${id}/`, data),

  delete: (id: number) => client.delete(`/chapters/${id}/`),

  import: (projectId: number, file: File, chapterTitle?: string) => {
    const form = new FormData();
    form.append("project_id", String(projectId));
    form.append("file", file);
    if (chapterTitle) form.append("chapter_title", chapterTitle);
    return client.post<Chapter>("/chapters/import/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
