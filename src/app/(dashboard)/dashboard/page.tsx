"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { cn, formatCurrency, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  mockDashboardMetrics,
  mockActivities,
  mockUsers,
  getUserById,
} from "@/lib/mock-data";

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

// ── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage() {
  const metrics = mockDashboardMetrics;
  const [reportsOpen, setReportsOpen] = useState(false);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            Welcome back, Alex. Here&apos;s what&apos;s happening today.
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
            <button className="text-[12px] text-[var(--primary)] hover:underline">View all</button>
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
      <ReportsSheet open={reportsOpen} onClose={() => setReportsOpen(false)} />
    </div>
  );
}
