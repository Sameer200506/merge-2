"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Upload,
  Filter,
  MoreVertical,
  Target,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Globe,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useLeadsStore } from "@/stores/leads.store";
import type { Lead, LeadStatus, LeadSource } from "@/types";
import { NewLeadSheet } from "@/components/shared/new-lead-sheet";
import { ImportLeadsDialog } from "@/components/shared/import-leads-dialog";
import { toast } from "sonner";

const statusConfig: Record<LeadStatus, { label: string; className: string; color: string }> = {
  new: { label: "New", className: "badge-info", color: "#3b82f6" },
  contacted: { label: "Contacted", className: "badge-primary", color: "#8b5cf6" },
  qualified: { label: "Qualified", className: "badge-success", color: "#22c55e" },
  nurturing: { label: "Nurturing", className: "badge-warning", color: "#f59e0b" },
  unqualified: { label: "Unqualified", className: "badge-danger", color: "#ef4444" },
};

const sourceConfig: Record<LeadSource, { label: string; colorClass: string }> = {
  web: { label: "Web", colorClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  referral: { label: "Referral", colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  cold_outreach: { label: "Outreach", colorClass: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  linkedin: { label: "LinkedIn", colorClass: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  partner: { label: "Partner", colorClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  other: { label: "Other", colorClass: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
};

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Nurturing", value: "nurturing" },
  { label: "Unqualified", value: "unqualified" },
];

export default function LeadsPage() {
  const { leads, updateLeadStatus, deleteLead } = useLeadsStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Track which row is expanded to show notes/details
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Track open dropdowns
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const statsBase = leads.filter((lead) => {
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());
    
    const matchSource = sourceFilter === "all" || lead.source === sourceFilter;
    
    return matchSearch && matchSource;
  });

  const filtered = statsBase.filter((lead) => {
    return statusFilter === "all" || lead.status === statusFilter;
  });

  // Calculate metrics
  const totalLeadsCount = statsBase.length;
  const newLeadsCount = statsBase.filter((l) => l.status === "new").length;
  const qualifiedLeadsCount = statsBase.filter((l) => l.status === "qualified").length;
  const estWorkflowValue = statsBase
    .filter((l) => l.status === "qualified" || l.status === "nurturing")
    .reduce((sum, l) => sum + l.value, 0);

  const handleStatusChange = (id: string, status: LeadStatus) => {
    updateLeadStatus(id, status);
    toast.success(`Lead status updated to ${statusConfig[status].label}`);
    setActiveMenu(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead "${name}"?`)) {
      deleteLead(id);
      toast.success(`Lead "${name}" deleted`);
      setActiveMenu(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="text-[var(--primary)]" size={24} />
            Leads Workspace
          </h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            Manage incoming prospects, track communications, and import CSV lists.
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
          <button
            onClick={() => setImportOpen(true)}
            className="sos-btn border border-[var(--border-strong)] bg-[var(--background-muted)] hover:bg-[var(--background-subtle)] text-[13px] py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <Upload size={14} />
            Import CSV
          </button>
          <button
            onClick={() => setNewLeadOpen(true)}
            className="sos-btn sos-btn-primary text-[13px] py-1.5 px-3.5 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filter tab controls */}
      {filterOpen && (
        <div className="flex items-center gap-4 p-3 mb-4 sos-card bg-[var(--background-subtle)] border border-[var(--border)] rounded-xl animate-fade-in flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="nurturing">Nurturing</option>
              <option value="unqualified">Unqualified</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[var(--foreground-muted)]">Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="sos-input py-1 px-2.5 text-[12.5px] rounded-lg bg-[var(--background)] border border-[var(--border)] cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="web">Web</option>
              <option value="referral">Referral</option>
              <option value="cold_outreach">Outreach</option>
              <option value="linkedin">LinkedIn</option>
              <option value="partner">Partner</option>
              <option value="other">Other</option>
            </select>
          </div>

          {(statusFilter !== "all" || sourceFilter !== "all") && (
            <button
              onClick={() => { setStatusFilter("all"); setSourceFilter("all"); }}
              className="text-[12px] text-[var(--primary)] hover:underline ml-auto cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Active Leads", value: totalLeadsCount, icon: Target, color: "var(--primary)" },
          { label: "New Leads", value: newLeadsCount, icon: Users, color: "#3b82f6" },
          { label: "Qualified Leads", value: qualifiedLeadsCount, icon: Award, color: "#22c55e" },
          { label: "Qualified Workflow", value: formatCurrency(estWorkflowValue), icon: TrendingUp, color: "#f59e0b" },
        ].map((stat) => (
          <div key={stat.label} className="sos-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[20px] font-bold text-[var(--foreground)] tracking-tight">{stat.value}</p>
              <p className="text-[12px] text-[var(--foreground-muted)] mt-0.5">{stat.label}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[var(--background-muted)] border border-[var(--border)] flex items-center justify-center">
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="sos-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border-b border-[var(--border)] bg-[var(--background)]">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="sos-input pl-8 py-1.5 text-[13px]"
            />
          </div>
        </div>

        {/* Columns Header */}
        <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-[var(--background-subtle)] border-b border-[var(--border)]">
          <div className="w-5 flex-shrink-0" />
          <p className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Company / Contact</p>
          <p className="w-40 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Contact Details</p>
          <p className="w-24 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] text-center">Source</p>
          <p className="w-28 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] text-center">Status</p>
          <p className="w-28 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Value</p>
          <div className="w-10" />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 space-y-3 bg-[var(--background)]">
            <Target size={40} className="text-[var(--foreground-subtle)] opacity-40 animate-pulse" />
            <div>
              <p className="text-[14px] font-semibold text-[var(--foreground)]">No leads found</p>
              <p className="text-[12.5px] text-[var(--foreground-muted)] mt-0.5">Try adjusting your filters or import a new list.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] bg-[var(--background)]">
            {filtered.map((lead) => {
              const isExpanded = expandedRow === lead.id;
              const source = sourceConfig[lead.source];
              const status = statusConfig[lead.status];

              return (
                <div key={lead.id} className="transition-all hover:bg-[var(--background-muted)]/40">
                  {/* Main Row */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 px-4 py-3">
                    
                    {/* Expand Toggle */}
                    <button
                      onClick={() => toggleExpand(lead.id)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-[var(--border)] text-[var(--foreground-muted)] flex-shrink-0 cursor-pointer"
                      aria-label="Expand row details"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Company / Contact */}
                    <div className="flex-1 min-w-0" onClick={() => toggleExpand(lead.id)}>
                      <p className="text-[13.5px] font-semibold text-[var(--foreground)] truncate cursor-pointer hover:underline">
                        {lead.name}
                      </p>
                      <p className="text-[11.5px] text-[var(--foreground-subtle)] font-medium mt-0.5">
                        {lead.contactName}
                      </p>
                    </div>

                    {/* Contact Details */}
                    <div className="w-full md:w-40 space-y-0.5">
                      <a href={`mailto:${lead.email}`} className="text-[12px] text-[var(--foreground-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 truncate">
                        <Mail size={11} className="flex-shrink-0" />
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="text-[12px] text-[var(--foreground-subtle)] hover:text-[var(--primary)] flex items-center gap-1.5 truncate">
                          <Phone size={11} className="flex-shrink-0" />
                          {lead.phone}
                        </a>
                      )}
                    </div>

                    {/* Source */}
                    <div className="w-full md:w-24 flex md:justify-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", source.colorClass)}>
                        {source.label}
                      </span>
                    </div>

                    {/* Status Select Box */}
                    <div className="w-full md:w-28 flex md:justify-center">
                      <div className="relative">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={cn(
                            "text-[11px] font-semibold px-2.5 py-1 rounded-full border appearance-none pr-6 cursor-pointer text-center",
                            status.className
                          )}
                          style={{
                            border: `1px solid ${status.color}25`,
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="nurturing">Nurturing</option>
                          <option value="unqualified">Unqualified</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 pointer-events-none" />
                      </div>
                    </div>

                    {/* Deal Value */}
                    <div className="w-full md:w-28 text-left md:text-right">
                      <p className="text-[13px] font-semibold text-[var(--foreground)]">
                        {lead.value > 0 ? formatCurrency(lead.value) : "—"}
                      </p>
                      <p className="text-[10.5px] text-[var(--foreground-subtle)]">Est. Value</p>
                    </div>

                    {/* Action Dropdown Menu */}
                    <div className="w-10 flex justify-end relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                        className="sos-btn sos-btn-ghost p-1 cursor-pointer"
                        aria-label="Lead Actions"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Card */}
                      {activeMenu === lead.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-0 mt-6 w-40 bg-[var(--card)] border border-[var(--border-strong)] rounded-lg shadow-xl py-1 z-20 animate-scale-in">
                            <button
                              onClick={() => {
                                handleStatusChange(lead.id, "qualified");
                                toast.success(`Lead "${lead.name}" marked as qualified for a deal!`);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--foreground)] hover:bg-[var(--background-muted)] flex items-center gap-1.5 cursor-pointer font-medium"
                            >
                              <Award size={12} className="text-[#22c55e]" />
                              Qualify Lead
                            </button>
                            <button
                              onClick={() => toggleExpand(lead.id)}
                              className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--foreground)] hover:bg-[var(--background-muted)] flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText size={12} className="text-[var(--foreground-subtle)]" />
                              View Notes
                            </button>
                            <div className="border-t border-[var(--border)] my-1" />
                            <button
                              onClick={() => handleDelete(lead.id, lead.name)}
                              className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--danger)] hover:bg-[var(--danger-subtle)]/30 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              Delete Lead
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                  </div>

                  {/* Expanded Notes Section */}
                  {isExpanded && (
                    <div className="px-12 pb-4 pt-1 bg-[var(--background-muted)]/20 border-t border-[var(--border)]/50 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Internal Notes / Requirements</p>
                        <p className="text-[12.5px] text-[var(--foreground-muted)] bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] whitespace-pre-wrap leading-relaxed">
                          {lead.notes || "No notes provided for this lead. Click the status selector to advance them or record details."}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Lead Metadata</p>
                        <div className="bg-[var(--background)] p-3 rounded-lg border border-[var(--border)] space-y-1.5 text-[12px]">
                          <div className="flex justify-between">
                            <span className="text-[var(--foreground-subtle)]">Created Date</span>
                            <span className="font-medium text-[var(--foreground)]">{formatDate(lead.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--foreground-subtle)]">Last Updated</span>
                            <span className="font-medium text-[var(--foreground)]">{formatDate(lead.updatedAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--foreground-subtle)]">Sales Owner</span>
                            <span className="font-medium text-[var(--foreground)]">Alex Morgan</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--foreground-subtle)]">Account Reference</span>
                            <span className="font-mono font-medium text-[var(--foreground)]">{lead.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-over sheets / Dialog Modals */}
      <NewLeadSheet open={newLeadOpen} onClose={() => setNewLeadOpen(false)} />
      <ImportLeadsDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
