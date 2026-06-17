"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  premium: boolean;
  setUser: (user: User | null) => void;
  setPremium: (premium: boolean) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      premium: false,
      setUser: (user) => set({ user }),
      setPremium: (premium) => set({ premium }),
      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* noop */
        }
        set({ user: null, premium: false });
      },
      fetchMe: async () => {
        try {
          const res = await fetch("/api/me");
          if (res.ok) {
            const data = await res.json();
            set({ user: data.user, premium: !!data.subscription });
          } else {
            set({ user: null, premium: false });
          }
        } catch {
          /* noop */
        }
      },
    }),
    {
      name: "sablin-auth",
      partialize: (s) => ({ user: s.user, premium: s.premium }),
    }
  )
);
