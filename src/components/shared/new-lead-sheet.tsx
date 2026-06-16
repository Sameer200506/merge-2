"use client";

import { useState } from "react";
import { X, Target, Mail, Phone, DollarSign, FileText, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { LeadStatus, LeadSource } from "@/types";
import { useLeadsStore } from "@/stores/leads.store";

interface NewLeadSheetProps {
  open: boolean;
  onClose: () => void;
}

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: "web", label: "Web / Website" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "partner", label: "Partner" },
  { value: "other", label: "Other" },
];

const STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new", label: "New", color: "#3b82f6" },
  { value: "contacted", label: "Contacted", color: "#8b5cf6" },
  { value: "qualified", label: "Qualified", color: "#22c55e" },
  { value: "nurturing", label: "Nurturing", color: "#f59e0b" },
  { value: "unqualified", label: "Unqualified", color: "#ef4444" },
];

export function NewLeadSheet({ open, onClose }: NewLeadSheetProps) {
  const addLead = useLeadsStore((state) => state.addLead);
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    value: "",
    source: "web" as LeadSource,
    status: "new" as LeadStatus,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!form.contactName.trim()) {
      toast.error("Contact name is required");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("A valid contact email is required");
      return;
    }

    setSaving(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 600));

    addLead({
      name: form.name,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone || undefined,
      value: Number(form.value) || 0,
      source: form.source,
      status: form.status,
      notes: form.notes || undefined,
    });

    setSaving(false);
    toast.success(`Lead for "${form.name}" added successfully!`);
    onClose();
    setForm({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      value: "",
      source: "web",
      status: "new",
      notes: "",
    });
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-[440px] z-50",
          "bg-[var(--background)] border-l border-[var(--border)]",
          "flex flex-col shadow-2xl animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Target size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">New Lead</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Add a prospect lead manually</p>
            </div>
          </div>
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Company name */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Company Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Stripe, Acme Corp"
                className="sos-input"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Contact Name <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                <input
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                  placeholder="e.g. John Doe"
                  className="sos-input pl-8"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Email Address <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  type="email"
                  placeholder="name@company.com"
                  className="sos-input pl-8"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                <input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="sos-input pl-8"
                />
              </div>
            </div>

            {/* Value */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Estimated Value ($)
              </label>
              <div className="relative">
                <DollarSign size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                <input
                  value={form.value}
                  onChange={(e) => set("value", e.target.value)}
                  type="number"
                  placeholder="50000"
                  className="sos-input pl-8"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Lead Source
              </label>
              <div className="relative">
                <select
                  value={form.source}
                  onChange={(e) => set("source", e.target.value as LeadSource)}
                  className="sos-input appearance-none pr-8"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-2">
                Status
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("status", s.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer",
                      form.status === s.value
                        ? "border-transparent text-white"
                        : "border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--background-muted)] hover:border-[var(--border-strong)]"
                    )}
                    style={form.status === s.value ? { background: s.color } : {}}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <FileText size={11} className="inline mr-1" /> Notes / Details
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Details about the lead's requirements or how they found us..."
                rows={3}
                className="sos-input py-2 resize-none"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-[var(--background)] border-t border-[var(--border)] p-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="sos-btn sos-btn-ghost text-[12.5px] py-1.5 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="sos-btn sos-btn-primary text-[12.5px] py-1.5 px-4 flex items-center gap-1.5"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
