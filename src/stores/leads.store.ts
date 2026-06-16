"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lead, LeadStatus, LeadSource } from "@/types";

interface LeadsState {
  leads: Lead[];
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

      addLead: (leadData) => set((state) => {
        const newLead: Lead = {
          ...leadData,
          id: `lead_${Math.random().toString(36).substr(2, 9)}`,
          organizationId: "org_1",
          createdBy: "user_1",
          updatedBy: "user_1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return { leads: [newLead, ...state.leads] };
      }),

      importLeads: (newLeadsData) => set((state) => {
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
      }),

      updateLeadStatus: (id, status) => set((state) => ({
        leads: state.leads.map((l) =>
          l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l
        ),
      })),

      deleteLead: (id) => set((state) => ({
        leads: state.leads.filter((l) => l.id !== id),
      })),
    }),
    {
      name: "startupos-leads",
    }
  )
);
