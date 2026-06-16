"use client";

import { X, TrendingUp, DollarSign, Target, FolderKanban, Award, PieChart as PieIcon, BarChart2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { mockDashboardMetrics, mockDeals, mockProjects } from "@/lib/mock-data";
import { useLeadsStore } from "@/stores/leads.store";

interface ReportsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ReportsSheet({ open, onClose }: ReportsSheetProps) {
  const { leads } = useLeadsStore();

  if (!open) return null;

  // 1. Process Lead Sources data dynamically from store
  const sourceCounts = leads.reduce((acc, lead) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceLabels: Record<string, string> = {
    web: "Web",
    referral: "Referral",
    cold_outreach: "Outreach",
    linkedin: "LinkedIn",
    partner: "Partner",
    other: "Other",
  };

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#6b7280"];

  const leadSourceData = Object.entries(sourceCounts).map(([key, val], idx) => ({
    name: sourceLabels[key] || key,
    value: val,
    color: COLORS[idx % COLORS.length],
  }));

  // Ensure there's data even if empty
  const finalLeadSourceData = leadSourceData.length > 0 
    ? leadSourceData 
    : [
        { name: "Web", value: 1, color: "#6366f1" },
        { name: "Referral", value: 1, color: "#10b981" }
      ];

  // 2. Process Deals Pipeline stages
  const dealsByStage = mockDeals.reduce((acc, deal) => {
    // Stage counts
    const stageName = deal.stageId.replace("stage_", "").replace("_", " ");
    acc[stageName] = (acc[stageName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pipelineData = Object.entries(dealsByStage).map(([stage, count]) => ({
    stage: stage.charAt(0).toUpperCase() + stage.slice(1),
    count,
  }));

  // 3. Process Project status counts
  const projectStatuses = mockProjects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectStatusData = Object.entries(projectStatuses).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
  }));

  // Custom chart tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="sos-card px-3 py-2 text-[12.5px] shadow-lg border border-[var(--border-strong)]">
        <p className="font-semibold text-[var(--foreground)] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.payload?.color || "var(--primary)" }}>
            {p.name}: {p.name.includes("Value") || p.name.includes("Revenue") ? formatCurrency(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-[600px] z-50",
          "bg-[var(--background)] border-l border-[var(--border)]",
          "flex flex-col shadow-2xl animate-slide-in-right"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--background-muted)]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">Analytics & Performance Reports</h2>
              <p className="text-[12px] text-[var(--foreground-muted)]">Real-time performance metrics and charts</p>
            </div>
          </div>
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5 cursor-pointer" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[var(--background)]">

          {/* Quick stats banner */}
          <div className="grid grid-cols-3 gap-3 bg-[var(--background-muted)]/50 p-4 rounded-xl border border-[var(--border)]">
            <div className="text-center">
              <p className="text-[11px] text-[var(--foreground-subtle)] font-medium uppercase tracking-wider">Active Deals</p>
              <p className="text-[18px] font-bold text-[var(--foreground)] mt-1">{mockDeals.length}</p>
            </div>
            <div className="text-center border-x border-[var(--border)]">
              <p className="text-[11px] text-[var(--foreground-subtle)] font-medium uppercase tracking-wider">Projects</p>
              <p className="text-[18px] font-bold text-[var(--foreground)] mt-1">{mockProjects.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[var(--foreground-subtle)] font-medium uppercase tracking-wider">Leads Pipeline</p>
              <p className="text-[18px] font-bold text-[#22c55e] mt-1">
                {formatCurrency(leads.reduce((s, l) => s + l.value, 0))}
              </p>
            </div>
          </div>

          {/* Chart 1: Revenue Forecast vs Actual */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-[var(--primary)]" />
              <h3 className="text-[13.5px] font-bold text-[var(--foreground)]">Revenue Trends & Forecasts</h3>
            </div>
            <div className="sos-card p-4 bg-[var(--background-subtle)]/30 border border-[var(--border)]">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={mockDashboardMetrics.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} />
                  <Area type="monotone" dataKey="forecast" name="Forecast Value" stroke="#6366f1" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={2} />
                  <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#22c55e" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Lead Sources Pie Chart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <PieIcon size={15} className="text-[#3b82f6]" />
              <h3 className="text-[13.5px] font-bold text-[var(--foreground)]">Lead Sources Effectiveness</h3>
            </div>
            <div className="sos-card p-4 bg-[var(--background-subtle)]/30 border border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalLeadSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {finalLeadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <p className="text-[11.5px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Distribution</p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  {finalLeadSourceData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[var(--foreground-muted)] truncate">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Pipeline Stage Bar Chart & Project Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sales Pipeline stages */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={15} className="text-[#f59e0b]" />
                <h3 className="text-[13.5px] font-bold text-[var(--foreground)]">Sales Funnel</h3>
              </div>
              <div className="sos-card p-4 bg-[var(--background-subtle)]/30 border border-[var(--border)]">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={pipelineData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="stage" tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="count" name="Deals Count" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project statuses */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderKanban size={15} className="text-[#10b981]" />
                <h3 className="text-[13.5px] font-bold text-[var(--foreground)]">Project Delivery</h3>
              </div>
              <div className="sos-card p-4 bg-[var(--background-subtle)]/30 border border-[var(--border)]">
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={projectStatusData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="status" tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "var(--foreground-muted)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="count" name="Projects" fill="#10b981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--background-muted)]/20 border-t border-[var(--border)] p-4 flex justify-end">
          <button
            onClick={onClose}
            className="sos-btn sos-btn-primary text-[12.5px] py-1.5 px-4 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
