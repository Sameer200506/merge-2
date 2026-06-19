"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Organization } from "@/types";
import { mockUsers } from "@/lib/mock-data";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

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
  sessionId: string | null;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setOrganization: (org: Organization) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
      sessionId: null,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));
        const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          set({ isLoading: false });
          throw new Error("Invalid email. Please use a mock employee email.");
        }

        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "sessions", found.id), {
              userId: found.id,
              sessionId: newSessionId,
              lastActive: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Firestore session login write error:", e);
          }
        }

        set({
          user: found,
          organization: MOCK_ORG,
          isAuthenticated: true,
          isLoading: false,
          sessionId: newSessionId,
        });
      },

      logout: () => {
        const { user } = get();
        if (user && isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              await deleteDoc(doc(db, "sessions", user.id));
            } catch (e) {
              console.error("Firestore session logout delete error:", e);
            }
          };
          runAsync();
        }

        set({ user: null, organization: null, isAuthenticated: false, sessionId: null });
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
        sessionId: state.sessionId,
      }),
    }
  )
);
