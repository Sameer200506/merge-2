"use client";

import { useState } from "react";
import {
  X,
  FolderKanban,
  Calendar,
  Users,
  Tag,
  ChevronDown,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockCustomers, mockUsers } from "@/lib/mock-data";
import { toast } from "sonner";
import type { ProjectStatus, ProjectPriority } from "@/types";

interface NewProjectSheetProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES: { value: ProjectPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "critical", label: "Critical", color: "#ef4444" },
];

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "review", label: "Review" },
  { value: "on_hold", label: "On Hold" },
];

export function NewProjectSheet({ open, onClose }: NewProjectSheetProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    customerId: "",
    status: "planning" as ProjectStatus,
    priority: "medium" as ProjectPriority,
    ownerId: mockUsers[2]?.id ?? "",
    startDate: "",
    endDate: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success(`Project "${form.name}" created!`);
    onClose();
    setForm({
      name: "",
      description: "",
      customerId: "",
      status: "planning",
      priority: "medium",
      ownerId: mockUsers[2]?.id ?? "",
      startDate: "",
      endDate: "",
      tags: "",
    });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-[440px] z-50",
        "bg-[var(--background)] border-l border-[var(--border)]",
        "flex flex-col shadow-2xl animate-slide-in-right"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <FolderKanban size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">New Project</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Create a project workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Name */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Project Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Website Redesign Q3"
                className="sos-input"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <AlignLeft size={11} className="inline mr-1" />Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                className="sos-input resize-none"
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Link to Customer
              </label>
              <div className="relative">
                <select
                  value={form.customerId}
                  onChange={(e) => set("customerId", e.target.value)}
                  className="sos-input appearance-none pr-8"
                >
                  <option value="">No customer (internal)</option>
                  {mockCustomers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as ProjectStatus)}
                  className="sos-input appearance-none pr-8"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-2">Priority</label>
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
                        : "border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--background-muted)]"
                    )}
                    style={form.priority === p.value ? { background: p.color } : {}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Manager */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <Users size={11} className="inline mr-1" />Project Manager
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                  <Calendar size={11} className="inline mr-1" />Start Date
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="sos-input cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="sos-input cursor-pointer"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <Tag size={11} className="inline mr-1" />Tags
              </label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                placeholder="migration, enterprise, q3"
                className="sos-input"
              />
            </div>

            {/* Preview */}
            {form.name && (
              <div className="p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)] animate-fade-in">
                <p className="text-[11.5px] font-medium text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[var(--foreground)]">{form.name}</p>
                    <p className="text-[11.5px] text-[var(--foreground-muted)] capitalize mt-0.5">
                      {form.status} · {form.priority} priority
                      {form.customerId && ` · ${mockCustomers.find(c => c.id === form.customerId)?.name}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-[var(--border)] bg-[var(--background-subtle)]">
          <button type="button" onClick={onClose} className="sos-btn sos-btn-outline flex-1 justify-center">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            className="sos-btn sos-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderKanban size={13} />
            {saving ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </>
  );
}
