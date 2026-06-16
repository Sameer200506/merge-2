"use client";

import { useState } from "react";
import {
  X,
  CheckSquare,
  Calendar,
  User,
  Tag,
  ChevronDown,
  AlignLeft,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUsers, mockProjects } from "@/lib/mock-data";
import { toast } from "sonner";
import type { TaskStatus, TaskPriority, TaskType } from "@/types";

interface NewTaskSheetProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "none", label: "None", color: "#94a3b8" },
  { value: "low", label: "Low", color: "#22c55e" },
  { value: "medium", label: "Medium", color: "#eab308" },
  { value: "high", label: "High", color: "#f97316" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

const STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "backlog", label: "Backlog", color: "#94a3b8" },
  { value: "todo", label: "Todo", color: "#6366f1" },
  { value: "in_progress", label: "In Progress", color: "#f59e0b" },
  { value: "in_review", label: "In Review", color: "#8b5cf6" },
  { value: "done", label: "Done", color: "#22c55e" },
];

const TYPES: { value: TaskType; label: string }[] = [
  { value: "project", label: "Project" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
];

export function NewTaskSheet({ open, onClose, defaultStatus = "todo" }: NewTaskSheetProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "project" as TaskType,
    status: defaultStatus,
    priority: "medium" as TaskPriority,
    assigneeId: "",
    projectId: "",
    dueDate: "",
    estimatedHours: "",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    toast.success(`Task "${form.title}" created!`);
    onClose();
    setForm({
      title: "",
      description: "",
      type: "project",
      status: defaultStatus,
      priority: "medium",
      assigneeId: "",
      projectId: "",
      dueDate: "",
      estimatedHours: "",
      tags: "",
    });
  };

  if (!open) return null;

  const selectedStatus = STATUSES.find((s) => s.value === form.status);

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
              <CheckSquare size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">New Task</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Add a task to your board</p>
            </div>
          </div>
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5"><X size={16} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Title */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                Task Title <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Set up CI/CD pipeline"
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
                placeholder="What needs to be done?"
                rows={3}
                className="sos-input resize-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Type</label>
              <div className="flex items-center gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[12px] font-medium border transition-all",
                      form.type === t.value
                        ? "bg-[var(--primary)] border-transparent text-white"
                        : "border-[var(--border)] text-[var(--foreground-muted)] bg-[var(--background-muted)]"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status + Priority row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as TaskStatus)}
                    className="sos-input appearance-none pr-8"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Priority</label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={(e) => set("priority", e.target.value as TaskPriority)}
                    className="sos-input appearance-none pr-8"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <User size={11} className="inline mr-1" />Assignee
              </label>
              <div className="relative">
                <select
                  value={form.assigneeId}
                  onChange={(e) => set("assigneeId", e.target.value)}
                  className="sos-input appearance-none pr-8"
                >
                  <option value="">Unassigned</option>
                  {mockUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.displayName}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                <FolderKanban size={11} className="inline mr-1" />Project
              </label>
              <div className="relative">
                <select
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                  className="sos-input appearance-none pr-8"
                >
                  <option value="">No project</option>
                  {mockProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Due date + Estimate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                  <Calendar size={11} className="inline mr-1" />Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
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
                  Est. Hours
                </label>
                <input
                  type="number"
                  value={form.estimatedHours}
                  onChange={(e) => set("estimatedHours", e.target.value)}
                  placeholder="e.g. 4"
                  className="sos-input"
                  min="0"
                  step="0.5"
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
                placeholder="backend, api, auth"
                className="sos-input"
              />
            </div>

            {/* Preview */}
            {form.title && (
              <div className="p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)] animate-fade-in">
                <p className="text-[11.5px] font-medium text-[var(--foreground-subtle)] uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-start gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                    style={{ background: selectedStatus?.color ?? "#94a3b8" }}
                  />
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--foreground)]">{form.title}</p>
                    <p className="text-[11.5px] text-[var(--foreground-muted)] mt-0.5 capitalize">
                      {selectedStatus?.label} · {form.priority} priority · {form.type}
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
            disabled={saving || !form.title.trim()}
            className="sos-btn sos-btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckSquare size={13} />
            {saving ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </>
  );
}
