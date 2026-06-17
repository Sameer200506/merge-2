"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Organization, UserRole } from "@/types";
import { mockUsers } from "@/lib/mock-data";

const MOCK_ORG: Organization = {
  id: "org_1",
  name: "Acme Corp",
  slug: "acme-corp",
  logoUrl: undefined,
  website: "acmecorp.io",
  industry: "technology",
  timezone: "America/New_York",
  currency: "USD",
  plan: "growth",
  status: "active",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
};

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setOrganization: (org: Organization) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          set({ isLoading: false });
          throw new Error("Invalid email. Please use a mock employee email.");
        }
        set({ user: found, organization: MOCK_ORG, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, organization: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user }),
      setOrganization: (organization) => set({ organization }),
    }),
    {
      name: "startupos-auth",
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
