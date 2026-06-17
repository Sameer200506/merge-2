"use client";

import { useState } from "react";
import { X, TrendingUp, Building2, DollarSign, Calendar, User, Tag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCustomers, mockWorkflow, mockUsers } from "@/lib/mock-data";
import { toast } from "sonner";
import type { DealPriority } from "@/types";

interface NewDealSheetProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES: { value: DealPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "critical", label: "Critical", color: "#ef4444" },
];

export function NewDealSheet({ open, onClose }: NewDealSheetProps) {
  const [form, setForm] = useState({
    title: "",
    customerId: "",
    stageId: mockWorkflow.stages[0]?.id ?? "",
    value: "",
    probability: "25",
    priority: "medium" as DealPriority,
    ownerId: mockUsers[0]?.id ?? "",
    expectedCloseDate: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Deal title is required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success(`Deal "${form.title}" created successfully!`);
    onClose();
    setForm({
      title: "",
      customerId: "",
      stageId: mockWorkflow.stages[0]?.id ?? "",
      value: "",
      probability: "25",
      priority: "medium",
      ownerId: mockUsers[0]?.id ?? "",
      expectedCloseDate: "",
      tags: "",
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
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
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">New Deal</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Add to workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sos-btn sos-btn-ghost p-1.5"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Deal Title <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Acme Corp — Enterprise License"
                className="sos-input"
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <Building2 size={11} className="inline mr-1" />
                Customer
              </label>
              <div className="relative">
                <select
                  value={form.customerId}
                  onChange={(e) => set("customerId", e.target.value)}
                  className="sos-input appearance-none pr-8"
                >
                  <option value="">Select a customer...</option>
                  {mockCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Stage */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Workflow Stage
              </label>
              <div className="relative">
                <select
                  value={form.stageId}
                  onChange={(e) => {
                    const stage = mockWorkflow.stages.find((s) => s.id === e.target.value);
                    set("stageId", e.target.value);
                    if (stage) set("probability", String(stage.probability));
                  }}
                  className="sos-input appearance-none pr-8"
                >
                  {mockWorkflow.stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Value + Probability row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                  <DollarSign size={11} className="inline mr-0.5" />
                  Deal Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] text-[13px]">$</span>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => set("value", e.target.value)}
                    placeholder="0"
                    className="sos-input pl-6"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                  Win Probability
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.probability}
                    onChange={(e) => set("probability", e.target.value)}
                    placeholder="50"
                    className="sos-input pr-7"
                    min="0"
                    max="100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] text-[13px]">%</span>
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-2">
                Priority
              </label>
              <div className="flex items-center gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("priority", p.value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                      form.priority === p.value
                        ? "border-transparent text-white"
                        : "border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--background-muted)] hover:border-[var(--border-strong)]"
                    )}
                    style={
                      form.priority === p.value
                        ? { background: p.color }
                        : {}
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <User size={11} className="inline mr-1" />
                Owner
              </label>
              <div className="relative">
                <select
                  value={form.ownerId}
                  onChange={(e) => set("ownerId", e.target.value)}
                  className="sos-input appearance-none pr-8"
                >
                  {mockUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Expected close date */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <Calendar size={11} className="inline mr-1" />
                Expected Close Date
              </label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => set("expectedCloseDate", e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                className="sos-input cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <Tag size={11} className="inline mr-1" />
                Tags
                <span className="text-[11px] text-[var(--foreground-subtle)] ml-1">(comma-separated)</span>
              </label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="enterprise, annual, strategic"
                className="sos-input"
              />
            </div>

            {/* Preview card */}
            {form.title && (
              <div className="p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)] animate-fade-in">
                <p className="text-[11.5px] font-medium text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--foreground)]">{form.title}</p>
                    {form.customerId && (
                      <p className="text-[11.5px] text-[var(--foreground-muted)] mt-0.5">
                        {mockCustomers.find((c) => c.id === form.customerId)?.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {form.value && (
                      <p className="text-[14px] font-bold text-[var(--foreground)]">
                        ${Number(form.value).toLocaleString()}
                      </p>
                    )}
                    <p className="text-[11.5px] text-[var(--foreground-muted)]">
                      {form.probability}% probability
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--background-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="sos-btn sos-btn-outline flex-1 justify-center"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="sos-btn sos-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TrendingUp size={13} />
            {saving ? "Creating..." : "Create Deal"}
          </button>
        </div>
      </div>
    </>
  );
}
