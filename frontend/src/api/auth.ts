import client from "./client";
import type { User } from "@/types";

export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    profile: string;
  }) => client.post<User>("/auth/register/", data),

  login: (data: { username: string; password: string }) =>
    client.post<{ access: string; refresh: string; user: User }>("/auth/login/", data),

  me: () => client.get<User>("/auth/me/"),
};
