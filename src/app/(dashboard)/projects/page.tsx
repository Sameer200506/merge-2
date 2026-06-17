"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionMenu } from "@/components/shared/action-menu";
import { toast } from "sonner";
import {
  Plus,
  Filter,
  Grid3X3,
  List,
  FolderKanban,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  MoreHorizontal,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { mockProjects, mockCustomers, getUserById, mockUsers } from "@/lib/mock-data";
import type { ProjectStatus } from "@/types";
import { NewProjectSheet } from "@/components/shared/new-project-sheet";
import { useAuthStore } from "@/stores/auth.store";

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  planning: { label: "Planning", className: "status-planning" },
  active: { label: "Active", className: "status-active" },
  review: { label: "Review", className: "status-review" },
  completed: { label: "Completed", className: "status-completed" },
  on_hold: { label: "On Hold", className: "status-on_hold" },
};

function ProjectCard({ project }: { project: (typeof mockProjects)[0] }) {
  const customer = mockCustomers.find((c) => c.id === project.customerId);
  const status = statusConfig[project.status];
  const teamMembers = project.teamIds.slice(0, 3).map((id) => getUserById(id)).filter(Boolean);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="sos-card p-5 block hover:shadow-[var(--card-shadow-md)] transition-all hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <FolderKanban size={16} className="text-white" />
        </div>
        <div onClick={(e) => e.preventDefault()}>
          <ActionMenu actions={[
            { label: "Edit Project", icon: Pencil, onClick: () => toast.info("Edit project feature coming soon") },
            { label: "Delete Project", icon: Trash2, danger: true, onClick: () => toast.success("Project deleted") },
          ]} />
        </div>
      </div>

      {/* Name & Customer */}
      <h3 className="text-[14px] font-semibold text-[var(--foreground)] leading-tight mb-1">
        {project.name}
      </h3>
      {customer && (
        <p className="text-[12px] text-[var(--foreground-muted)] mb-3">{customer.name}</p>
      )}

      {/* Status */}
      <span className={cn("text-[11.5px] font-medium px-2 py-0.5 rounded-full mb-3 inline-block", status.className)}>
        {status.label}
      </span>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[var(--foreground-muted)]">Progress</span>
          <span className="text-[11px] font-medium text-[var(--foreground)]">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-[var(--background-muted)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }}
          />
        </div>
      </div>

      {/* Milestones */}
      {project.milestones.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 text-[11.5px] text-[var(--foreground-muted)]">
          <CheckCircle2 size={12} className="text-[#22c55e]" />
          <span>
            {project.milestones.filter((m) => m.isCompleted).length}/{project.milestones.length} milestones
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
        {/* Team avatars */}
        <div className="flex items-center -space-x-1.5">
          {teamMembers.map((member) => member && (
            <div
              key={member.id}
              className="w-6 h-6 rounded-full gradient-primary border-2 border-[var(--card)] flex items-center justify-center text-[9px] font-bold text-white"
              title={member.displayName}
            >
              {getInitials(member.displayName)}
            </div>
          ))}
          {project.teamIds.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-[var(--background-muted)] border-2 border-[var(--card)] flex items-center justify-center text-[9px] font-medium text-[var(--foreground-muted)]">
              +{project.teamIds.length - 3}
            </div>
          )}
        </div>

        {project.endDate && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--foreground-subtle)]">
            <Calendar size={10} />
            {formatDate(project.endDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const baseProjects = user?.role === "team_member"
    ? mockProjects.filter((p) => p.teamIds.includes(user.id))
    : mockProjects;

  const statsBase = baseProjects.filter((p) => {
    const matchPriority = priorityFilter === "all" || p.priority === priorityFilter;
    const matchOwner = ownerFilter === "all" || p.ownerId === ownerFilter;
    return matchPriority && matchOwner;
  });

  const stats = {
    total: statsBase.length,
    active: statsBase.filter((p) => p.status === "active").length,
    review: statsBase.filter((p) => p.status === "review").length,
    completed: statsBase.filter((p) => p.status === "completed").length,
  };

  const filtered = statsBase.filter((p) => {
    return filter === "all" || p.status === filter;
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            {stats.active} active · {stats.review} in review · {stats.total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={cn(
              "sos-btn sos-btn-outline py-1.5 px-3 text-[12.5px] cursor-pointer",
              filterOpen && "bg-[var(--background-muted)] border-[var(--border-strong)]"
            )}
          >
            <Filter size={12} /> Filter
          </button>
          {user?.role !== "team_member" && (
            <button
              onClick={() => setNewProjectOpen(true)}
              className="sos-btn sos-btn-primary"
            >
              <Plus size={13} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* Filter tab controls */}
      {filterOpen && (
        <div className="flex items-center gap-4 p-3 mb-4 sos-card bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl animate-fade-in flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {user?.role !== "team_member" && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Project PM:</span>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
              >
                <option value="all">All Managers</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {(priorityFilter !== "all" || ownerFilter !== "all") && (
            <button
              onClick={() => { setPriorityFilter("all"); setOwnerFilter("all"); }}
              className="text-[12px] text-[var(--primary)] hover:underline ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: stats.total, color: "var(--primary)" },
          { label: "Active", value: stats.active, color: "#22c55e" },
          { label: "In Review", value: stats.review, color: "#f59e0b" },
          { label: "Completed", value: stats.completed, color: "#64748b" },
        ].map((s) => (
          <div key={s.label} className="sos-card px-4 py-3">
            <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[12px] text-[var(--foreground-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(["all", "planning", "active", "review", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-[12.5px] px-3 py-1.5 rounded-md font-medium transition-colors capitalize",
              filter === f
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)]"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {/* New project CTA */}
        {user?.role !== "team_member" && (
          <button
            onClick={() => setNewProjectOpen(true)}
            className={cn(
              "sos-card p-5 border-2 border-dashed flex flex-col items-center justify-center gap-2",
              "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)]",
              "transition-all cursor-pointer min-h-[200px]"
            )}
          >
            <div className="w-9 h-9 rounded-lg border-2 border-dashed border-[var(--border-strong)] flex items-center justify-center">
              <Plus size={16} />
            </div>
            <p className="text-[13px] font-medium">New Project</p>
            <p className="text-[11.5px] text-[var(--foreground-subtle)]">Start from scratch or template</p>
          </button>
        )}
      </div>

      <NewProjectSheet open={newProjectOpen} onClose={() => setNewProjectOpen(false)} />
    </div>
  );
}
