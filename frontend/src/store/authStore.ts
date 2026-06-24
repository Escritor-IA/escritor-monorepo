import { create } from "zustand";
import type { User } from "@/types";
import i18n, { normalizeLanguage } from "@/i18n";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateCredits: (credits: number) => void;
  setLanguage: (lang: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),

  setUser: (user) => {
    const lang = normalizeLanguage(user.preferred_language ?? "pt-br");
    i18n.changeLanguage(lang);
    localStorage.setItem("escritor_lang", lang);
    set({ user, isAuthenticated: true });
  },

  updateCredits: (credits) =>
    set((state) =>
      state.user
        ? { user: { ...state.user, user_plan: { ...state.user.user_plan, credits } } }
        : {}
    ),

  setLanguage: (lang) => {
    const normalized = normalizeLanguage(lang);
    i18n.changeLanguage(normalized);
    localStorage.setItem("escritor_lang", normalized);
    set((state) =>
      state.user
        ? { user: { ...state.user, preferred_language: normalized as User["preferred_language"] } }
        : {}
    );
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },
}));
