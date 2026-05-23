import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateCredits: (credits: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),

  setUser: (user) => set({ user, isAuthenticated: true }),

  updateCredits: (credits) =>
    set((state) =>
      state.user
        ? { user: { ...state.user, user_plan: { ...state.user.user_plan, credits } } }
        : {}
    ),

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null, isAuthenticated: false });
  },
}));
