import client from "./client";
import type { User } from "@/types";

export const authApi = {
  register: (data: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => client.post<User>("/auth/register/", data),

  login: (data: { username: string; password: string }) =>
    client.post<{ access: string; refresh: string; user: User }>("/auth/login/", data),

  me: () => client.get<User>("/auth/me/"),

  verifyEmail: (data: { email: string; otp_code: string }) =>
    client.post<{ detail: string; access: string; refresh: string; user: User }>("/auth/verify-email/", data),

  resendOtp: (data: { email: string }) =>
    client.post<{ detail: string }>("/auth/resend-otp/", data),

  googleAuth: (data: { credential: string; confirm_link?: boolean }) =>
    client.post<
      | { access: string; refresh: string; user: User; is_new_user: boolean }
      | { link_required: true; email: string }
    >("/auth/google/", data),

  deleteAccount: () => client.delete("/auth/me/delete/"),

  updateLanguage: (preferred_language: string) =>
    client.patch<{ preferred_language: string }>("/auth/me/", { preferred_language }),
};
