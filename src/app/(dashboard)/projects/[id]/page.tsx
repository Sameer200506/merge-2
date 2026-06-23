"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  Circle,
  Calendar,
  Users,
  Settings,
  BarChart3,
  Plus,
  MoreHorizontal,
  Flag,
  Layers,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { mockProjects, mockTasks, mockCustomers, getUserById } from "@/lib/mock-data";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import type { ProjectStatus, TaskStatus } from "@/types";

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  planning: { label: "Planning", className: "status-planning" },
  active: { label: "Active", className: "status-active" },
  review: { label: "Review", className: "status-review" },
  completed: { label: "Completed", className: "status-completed" },
  on_hold: { label: "On Hold", className: "status-on_hold" },
};

const TABS = ["Overview", "Work Items", "Roadmap", "Sprints", "Documentation", "Files", "Settings"];

const taskStatusConfig: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#94a3b8" },
  todo: { label: "Todo", color: "#6366f1" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  in_review: { label: "In Review", color: "#8b5cf6" },
  done: { label: "Done", color: "#22c55e" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("Overview");

  const project = mockProjects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="empty-state">
        <FolderKanban size={40} className="mb-3 opacity-30" />
        <p className="font-medium text-[var(--foreground)]">Project not found</p>
        <Link href="/projects" className="mt-3 text-[var(--primary)] text-[13px] hover:underline flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Projects
        </Link>
      </div>
    );
  }

  const customer = mockCustomers.find((c) => c.id === project.customerId);
  const projectTasks = mockTasks.filter((t) => t.projectId === id);
  const statusCfg = statusConfig[project.status];
  const teamMembers = project.teamIds.map((uid) => getUserById(uid)).filter(Boolean);
  const owner = getUserById(project.ownerId);

  const tasksByStatus = {
    backlog: projectTasks.filter((t) => t.status === "backlog"),
    todo: projectTasks.filter((t) => t.status === "todo"),
    in_progress: projectTasks.filter((t) => t.status === "in_progress"),
    done: projectTasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <ArrowLeft size={13} />
        Projects
      </Link>

      {/* Header */}
      <div className="sos-card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <FolderKanban size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[20px] font-bold text-[var(--foreground)] leading-tight">{project.name}</h1>
              <span className={cn("text-[11.5px] font-medium px-2 py-0.5 rounded-full", statusCfg.className)}>
                {statusCfg.label}
              </span>
            </div>
            {customer && (
              <Link href={`/customers/${customer.id}`} className="text-[12.5px] text-[var(--primary)] hover:underline mt-1 inline-block">
                {customer.name}
              </Link>
            )}
            {project.description && (
              <p className="text-[13px] text-[var(--foreground-muted)] mt-2 max-w-2xl">{project.description}</p>
            )}
          </div>
          <div className="hidden lg:flex items-center gap-5 flex-shrink-0">
            <div className="text-center">
              <p className="text-[22px] font-bold text-[var(--foreground)]">{project.progress}%</p>
              <p className="text-[11px] text-[var(--foreground-muted)]">Progress</p>
            </div>
            <div className="text-center">
              <p className="text-[22px] font-bold text-[var(--foreground)]">{projectTasks.length}</p>
              <p className="text-[11px] text-[var(--foreground-muted)]">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-[22px] font-bold text-[var(--foreground)]">{project.milestones.length}</p>
              <p className="text-[11px] text-[var(--foreground-muted)]">Milestones</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-1.5 bg-[var(--background-muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${project.progress}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
            />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          {project.startDate && project.endDate && (
            <span className="flex items-center gap-1.5 text-[12px] text-[var(--foreground-muted)]">
              <Calendar size={12} />
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[12px] text-[var(--foreground-muted)]">
            <Users size={12} />
            {teamMembers.length} members
          </span>
          {/* Team avatars */}
          <div className="flex items-center -space-x-1.5">
            {teamMembers.slice(0, 5).map((m) => m && (
              <div key={m.id} className="w-6 h-6 rounded-full gradient-primary border-2 border-[var(--card)] flex items-center justify-center text-[9px] font-bold text-white" title={m.displayName}>
                {getInitials(m.displayName)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--border)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Milestones */}
            <div className="sos-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13.5px] font-semibold text-[var(--foreground)]">Milestones</h3>
                <button className="sos-btn sos-btn-ghost py-1 px-2 text-[12px]">
                  <Plus size={12} /> Add
                </button>
              </div>
              {project.milestones.length === 0 ? (
                <p className="text-[13px] text-[var(--foreground-muted)]">No milestones yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.milestones.map((ms) => (
                    <div key={ms.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)]">
                      {ms.isCompleted ? (
                        <CheckCircle2 size={16} className="text-[#22c55e] flex-shrink-0" />
                      ) : (
                        <Circle size={16} className="text-[var(--foreground-subtle)] flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-medium", ms.isCompleted && "line-through text-[var(--foreground-muted)]")}>
                          {ms.name}
                        </p>
                        {ms.description && <p className="text-[11.5px] text-[var(--foreground-muted)]">{ms.description}</p>}
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-[var(--foreground-subtle)]">
                        <Calendar size={10} />
                        {formatDate(ms.dueDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task summary */}
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Task Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(tasksByStatus).map(([status, tasks]) => {
                  const cfg = taskStatusConfig[status as TaskStatus];
                  return (
                    <div key={status} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)]">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <div>
                        <p className="text-[14px] font-bold text-[var(--foreground)]">{tasks.length}</p>
                        <p className="text-[11.5px] text-[var(--foreground-muted)]">{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Sprints */}
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Sprints</h3>
              {project.sprints.length === 0 ? (
                <p className="text-[13px] text-[var(--foreground-muted)]">No sprints yet.</p>
              ) : (
                <div className="space-y-2">
                  {project.sprints.map((sprint) => (
                    <div key={sprint.id} className="p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[12.5px] font-medium text-[var(--foreground)]">{sprint.name}</p>
                        <span className={cn(
                          "text-[10.5px] font-medium px-1.5 py-0.5 rounded-full capitalize",
                          sprint.status === "active" ? "badge-success" : sprint.status === "completed" ? "status-completed" : "badge-info"
                        )}>
                          {sprint.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--foreground-subtle)]">
                        {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team */}
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Team</h3>
              <div className="space-y-2">
                {teamMembers.map((m) => m && (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {getInitials(m.displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-[var(--foreground)] truncate">{m.displayName}</p>
                      <p className="text-[11px] text-[var(--foreground-muted)] capitalize">{m.role.replace("_", " ")}</p>
                    </div>
                    {m.id === project.ownerId && (
                      <span className="ml-auto text-[10.5px] badge-primary px-1.5 py-0.5 rounded-full">Lead</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Work Items" && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <button className="sos-btn sos-btn-primary">
              <Plus size={13} /> Add Task
            </button>
          </div>
          {projectTasks.length === 0 ? (
            <div className="empty-state sos-card">
              <Layers size={36} className="mb-3 opacity-30" />
              <p className="font-medium">No tasks yet</p>
            </div>
          ) : projectTasks.map((task) => {
            const assignee = getUserById(task.assigneeId ?? "");
            const statusCfg = taskStatusConfig[task.status];
            return (
              <div key={task.id} className="sos-card px-4 py-3 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: statusCfg.color }} />
                <p className="flex-1 text-[13px] font-medium text-[var(--foreground)]">{task.title}</p>
                <span className={cn("text-[11px] capitalize",
                  task.priority === "urgent" ? "priority-urgent" : task.priority === "high" ? "priority-high" : task.priority === "medium" ? "priority-medium" : "priority-low"
                )}>
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-[11.5px] text-[var(--foreground-subtle)]">
                    <Calendar size={11} />{formatDate(task.dueDate)}
                  </span>
                )}
                {assignee && (
                  <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-white" title={assignee.displayName}>
                    {getInitials(assignee.displayName)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "Documentation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--foreground)]">Project Documentation</h3>
              <p className="text-[12px] text-[var(--foreground-muted)]">Project wikis, technical notes, specifications, and checklists linked to this project</p>
            </div>
            <Link
              href={`/knowledge?projectId=${project.id}`}
              className="sos-btn sos-btn-primary py-1.5 px-3 text-[12.5px]"
            >
              <Plus size={12} /> Create Document
            </Link>
          </div>
          {/* List project documents from knowledge store */}
          <ProjectDocumentsList projectId={project.id} />
        </div>
      )}

      {(activeTab === "Roadmap" || activeTab === "Sprints" || activeTab === "Files" || activeTab === "Settings") && (
        <div className="empty-state sos-card">
          <FolderKanban size={36} className="mb-3 opacity-30" />
          <p className="font-medium text-[var(--foreground)]">{activeTab} view coming in Phase 2</p>
          <p className="text-[13px] mt-1">Advanced roadmap, sprint planning and file management</p>
        </div>
      )}
    </div>
  );
}

function ProjectDocumentsList({ projectId }: { projectId: string }) {
  const { documents, spaces } = useKnowledgeStore();
  const projectDocs = documents.filter((d) => d.projectId === projectId && d.status !== "archived");

  if (projectDocs.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--background-subtle)] text-[var(--foreground-subtle)]">
        <FileText size={28} className="mx-auto mb-2 opacity-25 text-[var(--primary)]" />
        <p className="text-[13px] font-semibold text-[var(--foreground)]">No documentation created yet</p>
        <p className="text-[11px] mt-0.5">Link documents to this project from the Knowledge Hub edit panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {projectDocs.map((doc) => {
        const space = spaces.find((s) => s.id === doc.spaceId);
        return (
          <Link
            key={doc.id}
            href={`/knowledge/space/${doc.spaceId}/${doc.id}`}
            className="flex items-center justify-between p-4 border border-[var(--border)] rounded-xl bg-[var(--card)] hover:border-[var(--primary)] transition-all group shadow-xs"
          >
            <div className="min-w-0 mr-4">
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[var(--primary)] border border-indigo-150 uppercase dark:bg-indigo-950/20">
                {space?.name || "Space"}
              </span>
              <h4 className="text-[13px] font-semibold text-[var(--foreground)] truncate mt-1.5 group-hover:text-[var(--primary)] transition-colors">
                {doc.title}
              </h4>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                Updated {formatDate(doc.updatedAt)}
              </p>
            </div>
            <ChevronRight size={14} className="text-[var(--foreground-subtle)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}
