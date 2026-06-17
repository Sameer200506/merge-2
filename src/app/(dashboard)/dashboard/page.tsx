"use client";

import { useState } from "react";
import Link from "next/link";
import { ReportsSheet } from "@/components/shared/reports-sheet";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  AlertCircle,
  DollarSign,
  Target,
  Activity,
  ArrowUpRight,
  Play,
  Square,
  Check,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn, formatCurrency, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  mockDashboardMetrics,
  mockActivities,
  mockUsers,
  getUserById,
  mockTasks,
} from "@/lib/mock-data";
import { useAuthStore } from "@/stores/auth.store";
import { useShiftsStore } from "@/stores/shifts.store";
import { toast } from "sonner";

// ── Duration Formatter Helper ─────────────────────────────────
function formatDuration(totalSeconds: number) {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, "0"),
    mins.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0")
  ].join(":");
}

// ── KPI Card ─────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function KPICard({ title, value, change, changeLabel, icon: Icon, iconColor, iconBg }: KPICardProps) {
  const isPositive = change >= 0;
  return (
    <div className="sos-card p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon size={17} className={iconColor} />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full",
            isPositive
              ? "bg-[var(--success-subtle)] text-[var(--success-foreground)]"
              : "bg-[var(--danger-subtle)] text-[var(--danger-foreground)]"
          )}
        >
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-[24px] font-bold text-[var(--foreground)] leading-tight tracking-tight">
        {value}
      </p>
      <p className="text-[12.5px] text-[var(--foreground-muted)] mt-1">{title}</p>
      {changeLabel && (
        <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">{changeLabel}</p>
      )}
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────
function ActivityItem({ activity }: { activity: (typeof mockActivities)[0] }) {
  const user = getUserById(activity.userId);
  const actionMap: Record<string, string> = {
    deal_won: "won deal",
    project_created: "created project",
    status_changed: "changed status",
    commented: "commented on",
    assigned: "assigned task",
    created: "added",
    file_uploaded: "uploaded file",
    task_completed: "completed task",
    mentioned: "mentioned you in",
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
        {user ? getInitials(user.displayName) : "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[var(--foreground)]">
          <span className="font-medium">{user?.displayName ?? "Someone"}</span>{" "}
          <span className="text-[var(--foreground-muted)]">{actionMap[activity.type] ?? activity.type}</span>{" "}
          <span className="font-medium">{activity.entityName}</span>
        </p>
        {activity.comment && (
          <p className="text-[12px] text-[var(--foreground-muted)] mt-0.5 line-clamp-1">
            {activity.comment}
          </p>
        )}
        <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}

// ── Team Workload ─────────────────────────────────────────────
function TeamWorkloadBar({
  userName,
  assignedTasks,
  completedTasks,
}: {
  userName: string;
  assignedTasks: number;
  completedTasks: number;
}) {
  const pct = assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[12.5px] font-medium text-[var(--foreground)]">{userName}</p>
        <p className="text-[11.5px] text-[var(--foreground-muted)]">
          {completedTasks}/{assignedTasks} tasks
        </p>
      </div>
      <div className="h-1.5 bg-[var(--background-muted)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
          }}
        />
      </div>
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="sos-card px-3 py-2 text-[12.5px] shadow-lg">
      <p className="font-medium text-[var(--foreground)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Pipeline Stage Bar ────────────────────────────────────────
function PipelineStageBar() {
  const stages = [
    { name: "Lead", count: 2, color: "#6366f1" },
    { name: "Qualified", count: 1, color: "#8b5cf6" },
    { name: "Demo", count: 1, color: "#a855f7" },
    { name: "Proposal", count: 1, color: "#d946ef" },
    { name: "Negotiation", count: 1, color: "#ec4899" },
    { name: "Won", count: 2, color: "#22c55e" },
  ];
  const total = stages.reduce((s, a) => s + a.count, 0);
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden mb-3 gap-0.5">
        {stages.map((s) => (
          <div
            key={s.name}
            style={{
              width: `${(s.count / total) * 100}%`,
              background: s.color,
            }}
            title={`${s.name}: ${s.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stages.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-[11.5px] text-[var(--foreground-muted)] truncate">{s.name}</span>
            <span className="text-[11.5px] font-medium text-[var(--foreground)] ml-auto">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Employee Dashboard View (For team_member role) ─────────────
function EmployeeDashboardView({ user }: { user: any }) {
  const { activeShifts, shifts, clockIn, clockOut } = useShiftsStore();
  const activeShift = activeShifts.find((s) => s.userId === user.id);
  const isClockedIn = !!activeShift;

  const [myTasks, setMyTasks] = useState(() =>
    mockTasks.filter((t) => t.assigneeId === user.id)
  );

  const toggleTask = (taskId: string) => {
    setMyTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = t.status === "done" ? "todo" : "done";
          toast.success(newStatus === "done" ? "Task marked as completed!" : "Task marked as incomplete");
          return { ...t, status: newStatus };
        }
        return t;
      })
    );
  };

  const myCompletedShifts = shifts.filter(
    (s) => s.userId === user.id && s.isCompleted
  );

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            Welcome back, {user.displayName}. Here&apos;s your shift and task summary.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shift Controller */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sos-card p-6 flex flex-col justify-between h-full relative overflow-hidden">
            {/* Decorative background gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14.5px] font-semibold text-[var(--foreground)]">Shift Timer</h2>
                {isClockedIn ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    On Shift
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-400/10 px-2.5 py-0.5 rounded-full">
                    Off Shift
                  </span>
                )}
              </div>

              {/* Ticking time display */}
              <div className="text-center py-6">
                <span className="font-mono text-[42px] font-bold tracking-tight text-[var(--foreground)] leading-none">
                  {activeShift ? formatDuration(activeShift.durationSeconds) : "00:00:00"}
                </span>
                <p className="text-[12px] text-[var(--foreground-muted)] mt-2">
                  {isClockedIn
                    ? `Started at ${new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : "Ready to log hours"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              {isClockedIn ? (
                <button
                  onClick={() => {
                    clockOut(user.id);
                    toast.success("Clocked out of shift successfully.");
                  }}
                  className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-[13.5px] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Square size={14} fill="currentColor" />
                  Clock Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    clockIn(user.id);
                    toast.success("Clocked in to shift successfully!");
                  }}
                  className="w-full py-3 rounded-xl gradient-primary hover:opacity-90 text-white font-medium text-[13.5px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10"
                >
                  <Play size={14} fill="currentColor" />
                  Clock In
                </button>
              )}
            </div>
          </div>

          {/* Shift History */}
          <div className="sos-card p-5">
            <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3 flex items-center gap-1.5">
              <Clock size={14} className="text-[var(--foreground-subtle)]" />
              Shift History
            </h3>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {myCompletedShifts.length === 0 ? (
                <p className="text-[12px] text-[var(--foreground-subtle)] py-4 text-center">
                  No completed shifts in history
                </p>
              ) : (
                myCompletedShifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-[var(--foreground)]">
                        {new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-[var(--foreground-subtle)]">
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{" "}
                        {s.endTime ? new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </p>
                    </div>
                    <span className="font-mono text-[12px] font-semibold text-[var(--foreground-muted)]">
                      {formatDuration(s.durationSeconds)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="sos-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-[14.5px] font-semibold text-[var(--foreground)]">My Assigned Tasks</h2>
                <p className="text-[12px] text-[var(--foreground-muted)]">Check off completed items</p>
              </div>
              <span className="text-[11.5px] font-medium px-2 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)]">
                {myTasks.filter((t) => t.status !== "done").length} Open
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[460px] pr-2">
              {myTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 size={32} className="text-[var(--foreground-subtle)] opacity-40 mb-2" />
                  <p className="text-[13px] font-medium text-[var(--foreground-muted)]">All caught up!</p>
                  <p className="text-[12px] text-[var(--foreground-subtle)]">No tasks assigned to you.</p>
                </div>
              ) : (
                myTasks.map((task) => {
                  const isCompleted = task.status === "done";
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                        isCompleted
                          ? "bg-[var(--background-muted)]/40 border-[var(--border)] opacity-60"
                          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      <button
                        className={cn(
                          "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                          isCompleted
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                            : "border-[var(--border-strong)] hover:border-[var(--primary)]"
                        )}
                      >
                        {isCompleted && <Check size={10} strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[13px] font-medium text-[var(--foreground)] transition-all",
                            isCompleted && "line-through text-[var(--foreground-muted)]"
                          )}
                        >
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <span className="text-[11px] text-[var(--foreground-subtle)] mt-1 inline-flex items-center gap-1">
                            <Clock size={10} />
                            Due {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10.5px] font-medium px-2 py-0.5 rounded capitalize flex-shrink-0",
                          task.priority === "urgent" || task.priority === "high"
                            ? "bg-[var(--danger-subtle)] text-[var(--danger-foreground)]"
                            : task.priority === "medium"
                            ? "bg-[var(--warning-subtle)] text-[var(--warning-foreground)]"
                            : "bg-[var(--background-muted)] text-[var(--foreground-muted)]"
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Owner/Manager Dashboard View ──────────────────────────────
export default function DashboardPage() {
  const metrics = mockDashboardMetrics;
  const [reportsOpen, setReportsOpen] = useState(false);
  const { user } = useAuthStore();
  const { activeShifts, shifts } = useShiftsStore();

  // If employee is logged in, show employee-specific dashboard
  if (user?.role === "team_member") {
    return <EmployeeDashboardView user={user} />;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            Welcome back, {user?.displayName ?? "Alex"}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <button
          onClick={() => setReportsOpen(true)}
          className="sos-btn sos-btn-primary cursor-pointer"
        >
          <ArrowUpRight size={14} />
          View Reports
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pipeline Value"
          value={formatCurrency(metrics.pipelineValue)}
          change={metrics.pipelineChange}
          changeLabel="vs last month"
          icon={DollarSign}
          iconColor="text-[var(--primary)]"
          iconBg="bg-[var(--primary-subtle)]"
        />
        <KPICard
          title="Revenue Forecast"
          value={formatCurrency(metrics.revenueForecasted)}
          change={metrics.revenueChange}
          changeLabel="probability-weighted"
          icon={Target}
          iconColor="text-[#22c55e]"
          iconBg="bg-[var(--success-subtle)]"
        />
        <KPICard
          title="Leads This Week"
          value={String(metrics.leadsThisWeek)}
          change={metrics.leadsChange}
          changeLabel="new leads"
          icon={Users}
          iconColor="text-[#3b82f6]"
          iconBg="bg-[var(--info-subtle)]"
        />
        <KPICard
          title="Active Projects"
          value={String(metrics.activeProjects)}
          change={12}
          changeLabel={`${metrics.overdueTasks} overdue tasks`}
          icon={FolderKanban}
          iconColor="text-[#f59e0b]"
          iconBg="bg-[var(--warning-subtle)]"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart — 2 cols */}
        <div className="lg:col-span-2 sos-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Revenue Forecast</h2>
              <p className="text-[12px] text-[var(--foreground-muted)]">Forecast vs actual by month</p>
            </div>
            <span className="text-[12px] text-[var(--foreground-subtle)] bg-[var(--background-muted)] px-2 py-1 rounded-md">
              2024
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.revenueByMonth} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--foreground-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                formatter={(value) => <span style={{ color: "var(--foreground-muted)" }}>{value}</span>}
              />
              <Bar dataKey="forecast" name="Forecast" fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.7} />
              <Bar dataKey="actual" name="Actual" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline breakdown */}
        <div className="sos-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Pipeline</h2>
              <p className="text-[12px] text-[var(--foreground-muted)]">By stage</p>
            </div>
            <TrendingUp size={15} className="text-[var(--primary)]" />
          </div>
          <div className="mb-4">
            <p className="text-[26px] font-bold text-[var(--foreground)] tracking-tight">
              {formatCurrency(metrics.pipelineValue)}
            </p>
            <p className="text-[12px] text-[var(--foreground-muted)]">Total pipeline value</p>
          </div>
          <PipelineStageBar />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed — 2 cols */}
        <div className="lg:col-span-2 sos-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Recent Activity</h2>
            <Link href="/activity" className="text-[12px] text-[var(--primary)] hover:underline">View all</Link>
          </div>
          <div>
            {mockActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </div>

        {/* Team Workload */}
        <div className="sos-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Team Workload</h2>
            <Activity size={15} className="text-[var(--foreground-subtle)]" />
          </div>
          {metrics.teamWorkload.map((member) => (
            <TeamWorkloadBar
              key={member.userId}
              userName={member.userName}
              assignedTasks={member.assignedTasks}
              completedTasks={member.completedTasks}
            />
          ))}
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--foreground-muted)]">Overdue tasks</span>
              <span className="font-medium text-[var(--danger)]">
                {metrics.teamWorkload.reduce((s, m) => s + m.overdueTasks, 0)} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Team Shift Status ── */}
      <div className="sos-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Live Team Shift Status</h2>
            <p className="text-[12px] text-[var(--foreground-muted)]">Real-time shift clock status for all employees</p>
          </div>
          <span className="text-[11.5px] font-medium bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            {activeShifts.length} Working Now
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockUsers
            .filter((u) => u.id !== user?.id) // Show everyone except the current user
            .map((u) => {
              const activeShift = activeShifts.find((s) => s.userId === u.id);
              const isWorking = !!activeShift;
              const lastShift = shifts.find((s) => s.userId === u.id && s.isCompleted);

              return (
                <div
                  key={u.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[120px]",
                    isWorking
                      ? "bg-emerald-500/[0.02] border-emerald-500/20 shadow-md shadow-emerald-500/[0.02]"
                      : "bg-[var(--card)] border-[var(--border)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {getInitials(u.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-[var(--foreground)] truncate">{u.displayName}</p>
                      <p className="text-[11px] text-[var(--foreground-subtle)] capitalize truncate">
                        {u.role.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    {isWorking ? (
                      <>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                        <span className="font-mono text-[12px] font-bold text-[var(--foreground)]">
                          {formatDuration(activeShift.durationSeconds)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Off Shift
                        </span>
                        <span className="text-[10.5px] text-[var(--foreground-subtle)] truncate max-w-[100px]" title={
                          lastShift
                            ? `Last: ${formatDuration(lastShift.durationSeconds)} on ${new Date(lastShift.startTime).toLocaleDateString()}`
                            : "No shifts"
                        }>
                          {lastShift
                            ? `Last: ${formatDuration(lastShift.durationSeconds)}`
                            : "No shifts"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <ReportsSheet open={reportsOpen} onClose={() => setReportsOpen(false)} />
    </div>
  );
}
