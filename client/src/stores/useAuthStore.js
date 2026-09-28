import { create } from "zustand";
import * as authService from "../services/auth.service";

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  initializeSession: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const user = await authService.fetchCurrentUser();
      set({ user, loading: false, error: null });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, loading: false });
    }
  },

  login: (token, userData) => {
    localStorage.setItem("token", token);
    set({ user: userData, error: null });
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("token");
    set({ user: null });
  },

  setError: (error) => set({ error }),
}));
