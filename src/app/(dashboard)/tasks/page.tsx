"use client";

import { useState } from "react";
import { NewTaskSheet } from "@/components/shared/new-task-sheet";
import { ActionMenu } from "@/components/shared/action-menu";
import { toast } from "sonner";
import {
  Plus,
  Filter,
  List,
  Grip,
  Calendar,
  Clock,
  CheckSquare,
  Search,
  ChevronDown,
  Circle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MoreHorizontal,
  Tag,
  Paperclip,
  MessageSquare,
  ArrowRight,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { mockTasks, getUserById, mockProjects, mockUsers } from "@/lib/mock-data";
import type { Task, TaskStatus, TaskPriority } from "@/types";
import { useAuthStore } from "@/stores/auth.store";

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: "Backlog", icon: Circle, color: "#94a3b8" },
  todo: { label: "Todo", icon: Circle, color: "#6366f1" },
  in_progress: { label: "In Progress", icon: Loader2, color: "#f59e0b" },
  in_review: { label: "In Review", icon: AlertCircle, color: "#8b5cf6" },
  done: { label: "Done", icon: CheckCircle2, color: "#22c55e" },
  cancelled: { label: "Cancelled", icon: CheckCircle2, color: "#ef4444" },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  none: { label: "None", color: "#94a3b8" },
  low: { label: "Low", color: "#22c55e" },
  medium: { label: "Medium", color: "#eab308" },
  high: { label: "High", color: "#f97316" },
  urgent: { label: "Urgent", color: "#ef4444" },
};

const KANBAN_COLUMNS: TaskStatus[] = ["backlog", "todo", "in_progress", "in_review", "done"];

// ── Task Row (List view) ──────────────────────────────────────
function TaskRow({ task }: { task: Task }) {
  const assignee = getUserById(task.assigneeId ?? "");
  const project = mockProjects.find((p) => p.id === task.projectId);
  const statusCfg = statusConfig[task.status];
  const priorityCfg = priorityConfig[task.priority];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] hover:bg-[var(--background-subtle)] transition-colors group cursor-pointer">
      <StatusIcon size={15} style={{ color: statusCfg.color }} className="flex-shrink-0" />
      <p className="flex-1 text-[13px] text-[var(--foreground)] min-w-0 truncate">{task.title}</p>
      {project && (
        <span className="hidden lg:block text-[11.5px] text-[var(--foreground-muted)] bg-[var(--background-muted)] px-2 py-0.5 rounded truncate max-w-[120px]">
          {project.name}
        </span>
      )}
      <span className="text-[11px] font-medium hidden sm:block" style={{ color: priorityCfg.color }}>
        {priorityCfg.label}
      </span>
      {task.dueDate && (
        <span className="hidden md:flex items-center gap-1 text-[11.5px] text-[var(--foreground-subtle)]">
          <Calendar size={11} />
          {formatDate(task.dueDate)}
        </span>
      )}
      {task.checklist.length > 0 && (
        <span className="hidden sm:flex items-center gap-1 text-[11.5px] text-[var(--foreground-subtle)]">
          <CheckSquare size={11} />
          {task.checklist.filter((c) => c.isChecked).length}/{task.checklist.length}
        </span>
      )}
      {assignee && (
        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" title={assignee.displayName}>
          {getInitials(assignee.displayName)}
        </div>
      )}
      <div className="opacity-0 group-hover:opacity-100">
        <ActionMenu actions={[
          { label: "Edit Task", icon: Pencil, onClick: () => toast.info("Edit task feature coming soon") },
          { label: "Delete Task", icon: Trash2, danger: true, onClick: () => toast.success("Task deleted") },
        ]} />
      </div>
    </div>
  );
}

// ── Task Kanban Card ──────────────────────────────────────────
function TaskKanbanCard({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 };
  const assignee = getUserById(task.assigneeId ?? "");
  const priorityCfg = priorityConfig[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("kanban-card p-3 mb-2", isDragging && "shadow-2xl rotate-1 scale-105")}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[13px] font-medium text-[var(--foreground)] leading-tight flex-1">{task.title}</p>
        <button {...listeners} className="p-0.5 text-[var(--foreground-subtle)] cursor-grab active:cursor-grabbing flex-shrink-0">
          <Grip size={12} />
        </button>
      </div>
      {task.checklist.length > 0 && (
        <div className="mb-2">
          <div className="h-1 bg-[var(--background-muted)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: `${(task.checklist.filter((c) => c.isChecked).length / task.checklist.length) * 100}%` }}
            />
          </div>
          <p className="text-[10.5px] text-[var(--foreground-subtle)] mt-0.5">
            {task.checklist.filter((c) => c.isChecked).length}/{task.checklist.length} subtasks
          </p>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-medium" style={{ color: priorityCfg.color }}>{priorityCfg.label}</span>
          {task.dueDate && (
            <span className="flex items-center gap-0.5 text-[10.5px] text-[var(--foreground-subtle)]">
              <Calendar size={10} />{formatDate(task.dueDate)}
            </span>
          )}
        </div>
        {assignee && (
          <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-white">
            {getInitials(assignee.displayName)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  onAddTask,
  showAddTask = true,
}: {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  showAddTask?: boolean;
}) {
  const cfg = statusConfig[status];
  return (
    <div className="kanban-col flex-shrink-0 w-[260px] flex flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
          <span className="text-[12.5px] font-semibold text-[var(--foreground)]">{cfg.label}</span>
          <span className="text-[11px] text-[var(--foreground-subtle)] bg-[var(--background-muted)] px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        {showAddTask && (
          <button
            onClick={() => onAddTask(status)}
            className="sos-btn sos-btn-ghost p-1"
          >
            <Plus size={13} />
          </button>
        )}
      </div>
      <div className="flex-1 px-2 pb-2 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => <TaskKanbanCard key={task.id} task={task} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-16 text-[12px] text-[var(--foreground-subtle)] border-2 border-dashed border-[var(--border)] rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Tasks Page ───────────────────────────────────────────
export default function TasksPage() {
  const { user } = useAuthStore();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [tasks, setTasks] = useState(mockTasks);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState<TaskStatus>("todo");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const openNewTask = (status: TaskStatus = "todo") => {
    setNewTaskDefaultStatus(status);
    setNewTaskOpen(true);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = tasks.filter((t) => {
    if (user?.role === "team_member" && t.assigneeId !== user?.id) {
      return false;
    }
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchAssignee = assigneeFilter === "all" || (assigneeFilter === "unassigned" ? !t.assigneeId : t.assigneeId === assigneeFilter);
    return matchSearch && matchPriority && matchType && matchAssignee;
  });

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: overTask.status } : t));
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  const groupByStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            {filtered.filter((t) => t.status !== "done").length} open · {filtered.filter((t) => t.status === "done").length} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-[var(--background-muted)] border border-[var(--border)] rounded-lg p-0.5 gap-0.5">
            {([{ v: "list", Icon: List }, { v: "kanban", Icon: Grip }] as const).map(({ v, Icon }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center gap-1.5",
                  view === v ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)]"
                )}
              >
                <Icon size={13} />
                <span className="hidden sm:inline capitalize">{v}</span>
              </button>
            ))}
          </div>
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
              onClick={() => openNewTask("todo")}
              className="sos-btn sos-btn-primary"
            >
              <Plus size={13} /> New Task
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
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="project">Project</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
            </select>
          </div>

          {user?.role !== "team_member" && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Assignee:</span>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {mockUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {(priorityFilter !== "all" || typeFilter !== "all" || assigneeFilter !== "all") && (
            <button
              onClick={() => { setPriorityFilter("all"); setTypeFilter("all"); setAssigneeFilter("all"); }}
              className="text-[12px] text-[var(--primary)] hover:underline ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="sos-input pl-8 py-1.5 text-[13px]"
        />
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="sos-card overflow-hidden flex-1">
          {/* Table header */}
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--background-subtle)] border-b border-[var(--border)]">
            {["Status", "Task", "Project", "Priority", "Due Date", "Checklist", "Assignee", ""].map((h) => (
              <p key={h} className={cn("text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]",
                h === "Task" ? "flex-1" : h === "" ? "w-6" : ""
              )}>
                {h}
              </p>
            ))}
          </div>

          {/* Group by status */}
          {KANBAN_COLUMNS.map((status) => {
            const statusTasks = groupByStatus(status);
            if (statusTasks.length === 0) return null;
            const cfg = statusConfig[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-[var(--background-subtle)] border-b border-[var(--border)]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-[12px] font-semibold text-[var(--foreground)]">{cfg.label}</span>
                  <span className="text-[11px] text-[var(--foreground-subtle)]">{statusTasks.length}</span>
                </div>
                {statusTasks.map((task) => <TaskRow key={task.id} task={task} />)}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <CheckSquare size={36} className="mb-3 opacity-30" />
              <p className="font-medium text-[var(--foreground)]">No tasks found</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
            {KANBAN_COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={groupByStatus(status)}
                onAddTask={openNewTask}
                showAddTask={user?.role !== "team_member"}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskKanbanCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <NewTaskSheet
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        defaultStatus={newTaskDefaultStatus}
      />
    </div>
  );
}
