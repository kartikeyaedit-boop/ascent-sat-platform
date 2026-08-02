import { create } from "zustand";
import type { PublicUser } from "@/types/api";

interface AuthState {
  user: PublicUser | null;
  setUser: (user: PublicUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
