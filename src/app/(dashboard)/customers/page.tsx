"use client";

import { useState } from "react";
import Link from "next/link";
import { ActionMenu } from "@/components/shared/action-menu";
import { toast } from "sonner";
import {
  Search,
  Plus,
  ExternalLink,
  Building2,
  Filter,
  MoreHorizontal,
  Globe,
  TrendingUp,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { mockCustomers } from "@/lib/mock-data";
import type { Customer, CustomerStatus } from "@/types";
import { NewCustomerSheet } from "@/components/shared/new-customer-sheet";

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  lead: { label: "Lead", className: "badge-info" },
  prospect: { label: "Prospect", className: "badge-warning" },
  customer: { label: "Customer", className: "badge-success" },
  churned: { label: "Churned", className: "badge-danger" },
};

function CustomerRow({ customer }: { customer: Customer }) {
  const status = statusConfig[customer.status];
  return (
    <Link
      href={`/customers/${customer.id}`}
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-b border-[var(--border)]",
        "hover:bg-[var(--background-subtle)] transition-colors cursor-pointer"
      )}
    >
      {/* Logo / Avatar */}
      <div className="w-8 h-8 rounded-lg bg-[var(--background-muted)] border border-[var(--border)] flex items-center justify-center overflow-hidden flex-shrink-0">
        {customer.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={customer.logoUrl} alt={customer.name} className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <span className="text-[12px] font-bold text-[var(--foreground-muted)]">
            {getInitials(customer.name)}
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium text-[var(--foreground)] truncate">{customer.name}</p>
        {customer.website && (
          <p className="text-[11.5px] text-[var(--foreground-subtle)] flex items-center gap-1 mt-0.5">
            <Globe size={10} />
            {customer.website}
          </p>
        )}
      </div>

      {/* Industry */}
      <div className="hidden md:block w-32">
        <p className="text-[12.5px] text-[var(--foreground-muted)] capitalize">
          {customer.industry?.replace("_", " ") ?? "—"}
        </p>
      </div>

      {/* Status */}
      <div className="w-24 hidden sm:block">
        <span className={cn("text-[11.5px] font-medium px-2 py-0.5 rounded-full", status.className)}>
          {status.label}
        </span>
      </div>

      {/* Revenue */}
      <div className="hidden lg:block w-28 text-right">
        <p className="text-[13px] font-medium text-[var(--foreground)]">
          {customer.revenue ? formatCurrency(customer.revenue) : "—"}
        </p>
      </div>

      {/* Tags */}
      <div className="hidden xl:flex items-center gap-1 w-40">
        {customer.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[10.5px] px-1.5 py-0.5 rounded bg-[var(--background-muted)] text-[var(--foreground-muted)] border border-[var(--border)]"
          >
            {tag}
          </span>
        ))}
        {customer.tags.length > 2 && (
          <span className="text-[10.5px] text-[var(--foreground-subtle)]">+{customer.tags.length - 2}</span>
        )}
      </div>

      {/* Actions */}
      <div onClick={(e) => e.preventDefault()}>
        <ActionMenu actions={[
          { label: "Edit Customer", icon: Pencil, onClick: () => toast.info("Edit customer feature coming soon") },
          { label: "Delete Customer", icon: Trash2, danger: true, onClick: () => toast.success("Customer deleted") },
        ]} />
      </div>
    </Link>
  );
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Lead", value: "lead" },
  { label: "Prospect", value: "prospect" },
  { label: "Customer", value: "customer" },
  { label: "Churned", value: "churned" },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);

  const filtered = mockCustomers.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.website?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = mockCustomers
    .filter((c) => c.status === "customer")
    .reduce((s, c) => s + (c.revenue ?? 0), 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            {mockCustomers.length} companies · {formatCurrency(totalRevenue)} total revenue
          </p>
        </div>
        <button
          onClick={() => setNewCustomerOpen(true)}
          className="sos-btn sos-btn-primary"
        >
          <Plus size={14} />
          Add Customer
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: mockCustomers.length, color: "var(--primary)" },
          { label: "Leads", value: mockCustomers.filter((c) => c.status === "lead").length, color: "#3b82f6" },
          { label: "Prospects", value: mockCustomers.filter((c) => c.status === "prospect").length, color: "#f59e0b" },
          { label: "Customers", value: mockCustomers.filter((c) => c.status === "customer").length, color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} className="sos-card px-4 py-3">
            <p className="text-[22px] font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[12px] text-[var(--foreground-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="sos-card overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 border-b border-[var(--border)]">
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="sos-input pl-8 py-1.5 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "text-[12px] px-3 py-1 rounded-md font-medium transition-colors",
                  statusFilter === f.value
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="sos-btn sos-btn-ghost py-1 px-2 ml-auto">
            <Filter size={13} />
            <span className="hidden sm:inline text-[12.5px]">Filter</span>
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-2 bg-[var(--background-subtle)] border-b border-[var(--border)]">
          <div className="w-8 flex-shrink-0" />
          <p className="flex-1 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Company</p>
          <p className="hidden md:block w-32 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Industry</p>
          <p className="hidden sm:block w-24 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Status</p>
          <p className="hidden lg:block w-28 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] text-right">Revenue</p>
          <p className="hidden xl:block w-40 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Tags</p>
          <div className="w-6" />
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Building2 size={36} className="mb-3 opacity-30" />
            <p className="font-medium">No customers found</p>
            <p className="text-[13px] mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map((c) => <CustomerRow key={c.id} customer={c} />)
        )}
      </div>

      <NewCustomerSheet open={newCustomerOpen} onClose={() => setNewCustomerOpen(false)} />
    </div>
  );

}
