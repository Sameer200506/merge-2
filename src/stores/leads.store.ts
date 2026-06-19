"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lead, LeadStatus } from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";

interface LeadsState {
  leads: Lead[];
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Omit<Lead, "id" | "organizationId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">) => void;
  importLeads: (leads: Omit<Lead, "id" | "organizationId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">[]) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  deleteLead: (id: string) => void;
}

const INITIAL_MOCK_LEADS: Lead[] = [
  {
    id: "lead_1",
    organizationId: "org_1",
    name: "Vercel Inc.",
    contactName: "Guillermo Rauch",
    email: "guillermo@vercel.com",
    phone: "+1 (415) 555-0191",
    status: "new",
    source: "web",
    value: 50000,
    notes: "Interested in enterprise hosting and Next.js support package.",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_2",
    organizationId: "org_1",
    name: "Retool LLC",
    contactName: "David Hsu",
    email: "david@retool.com",
    phone: "+1 (415) 555-0192",
    status: "contacted",
    source: "referral",
    value: 24000,
    notes: "Referred by Alex. Looking for a custom internal tooling workshop.",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_3",
    organizationId: "org_1",
    name: "Supabase Inc.",
    contactName: "Paul Copplestone",
    email: "paul@supabase.io",
    phone: "+1 (415) 555-0193",
    status: "qualified",
    source: "linkedin",
    value: 36000,
    notes: "Reached out via LinkedIn. Interested in CRM sync capabilities.",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_4",
    organizationId: "org_1",
    name: "Resend Co.",
    contactName: "Zeno Rocha",
    email: "zeno@resend.com",
    phone: "+1 (415) 555-0194",
    status: "nurturing",
    source: "cold_outreach",
    value: 12000,
    notes: "Cold outbound campaign. Sent initial deck; scheduled follow-up.",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_5",
    organizationId: "org_1",
    name: "Clerk Dev",
    contactName: "Colin Sidoti",
    email: "colin@clerk.dev",
    phone: "+1 (415) 555-0195",
    status: "new",
    source: "partner",
    value: 18000,
    notes: "Co-marketing partner lead. Interested in unified login system.",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useLeadsStore = create<LeadsState>()(
  persist(
    (set) => ({
      leads: INITIAL_MOCK_LEADS,

      setLeads: (leads) => set({ leads }),

      addLead: (leadData) => {
        const newLead = {
          ...leadData,
          organizationId: "org_1",
          createdBy: "user_1",
          updatedBy: "user_1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const docRef = doc(collection(db, "leads"));
              await setDoc(docRef, { ...newLead, id: docRef.id });
            } catch (e) {
              console.error("Firestore addLead error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => {
          const leadWithId: Lead = {
            ...newLead,
            id: `lead_${Math.random().toString(36).substr(2, 9)}`,
          };
          return { leads: [leadWithId, ...state.leads] };
        });
      },

      importLeads: (newLeadsData) => {
        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const batch = writeBatch(db);
              newLeadsData.forEach((leadData) => {
                const docRef = doc(collection(db, "leads"));
                const newLead = {
                  ...leadData,
                  id: docRef.id,
                  organizationId: "org_1",
                  createdBy: "user_1",
                  updatedBy: "user_1",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                batch.set(docRef, newLead);
              });
              await batch.commit();
            } catch (e) {
              console.error("Firestore importLeads error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => {
          const parsedLeads: Lead[] = newLeadsData.map((leadData, index) => ({
            ...leadData,
            id: `lead_imported_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
            organizationId: "org_1",
            createdBy: "user_1",
            updatedBy: "user_1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          return { leads: [...parsedLeads, ...state.leads] };
        });
      },

      updateLeadStatus: (id, status) => {
        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const docRef = doc(db, "leads", id);
              await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
            } catch (e) {
              console.error("Firestore updateLeadStatus error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l
          ),
        }));
      },

      deleteLead: (id) => {
        if (isFirebaseConfigured && db) {
          const runAsync = async () => {
            try {
              const docRef = doc(db, "leads", id);
              await deleteDoc(docRef);
            } catch (e) {
              console.error("Firestore deleteLead error:", e);
            }
          };
          runAsync();
          return;
        }

        // Local fallback
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        }));
      },
    }),
    {
      name: "startupos-leads",
    }
  )
);
