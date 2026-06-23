"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  FolderKanban,
  Activity,
  FileText,
  Phone,
  Mail,
  Tag,
  MoreHorizontal,
  Plus,
  ExternalLink,
  Building2,
} from "lucide-react";
import { cn, formatCurrency, formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import {
  mockCustomers,
  mockDeals,
  mockProjects,
  mockActivities,
  mockUsers,
  getUserById,
} from "@/lib/mock-data";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { ChevronRight } from "lucide-react";
import type { CustomerStatus } from "@/types";
import { useState } from "react";

const statusConfig: Record<CustomerStatus, { label: string; className: string }> = {
  lead: { label: "Lead", className: "badge-info" },
  prospect: { label: "Prospect", className: "badge-warning" },
  customer: { label: "Customer", className: "badge-success" },
  churned: { label: "Churned", className: "badge-danger" },
};

const TABS = ["Overview", "Contacts", "Deals", "Projects", "Activity", "Documents", "Files"];

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("Overview");

  const customer = mockCustomers.find((c) => c.id === id);
  if (!customer) {
    return (
      <div className="empty-state">
        <Building2 size={40} className="mb-3 opacity-30" />
        <p className="font-medium text-[var(--foreground)]">Customer not found</p>
        <Link href="/customers" className="mt-3 text-[var(--primary)] text-[13px] hover:underline flex items-center gap-1">
          <ArrowLeft size={13} /> Back to Customers
        </Link>
      </div>
    );
  }

  const status = statusConfig[customer.status];
  const customerDeals = mockDeals.filter((d) => d.customerId === id);
  const customerProjects = mockProjects.filter((p) => p.customerId === id);
  const customerActivities = mockActivities.filter((a) => a.entityId === id || customerDeals.some((d) => d.id === a.entityId));

  const mockContacts = [
    { id: "c1", name: "Patrick Collison", role: "CEO", email: "patrick@" + customer.website, phone: "+1 415 555 0001", isPrimary: true },
    { id: "c2", name: "John Collison", role: "President", email: "john@" + customer.website, phone: "+1 415 555 0002", isPrimary: false },
  ];

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 transition-colors"
      >
        <ArrowLeft size={13} />
        Customers
      </Link>

      {/* Profile header */}
      <div className="sos-card p-6 mb-4">
        <div className="flex items-start gap-5">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-[var(--background-muted)] border border-[var(--border)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {customer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customer.logoUrl} alt={customer.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span className="text-[20px] font-bold text-[var(--foreground-muted)]">
                {getInitials(customer.name)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-[var(--foreground)] leading-tight">{customer.name}</h1>
              <span className={cn("text-[12px] font-medium px-2 py-0.5 rounded-full self-center", status.className)}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {customer.website && (
                <a href={`https://${customer.website}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12.5px] text-[var(--primary)] hover:underline">
                  <Globe size={12} />
                  {customer.website}
                  <ExternalLink size={10} />
                </a>
              )}
              {customer.address?.city && (
                <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--foreground-muted)]">
                  <MapPin size={12} />
                  {customer.address.city}, {customer.address.country}
                </span>
              )}
              {customer.industry && (
                <span className="flex items-center gap-1.5 text-[12.5px] text-[var(--foreground-muted)] capitalize">
                  <Building2 size={12} />
                  {customer.industry.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {customer.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[var(--background-muted)] text-[var(--foreground-muted)] border border-[var(--border)]">
                  <Tag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:grid grid-cols-3 gap-4 flex-shrink-0">
            {[
              { icon: DollarSign, label: "Revenue", value: customer.revenue ? formatCurrency(customer.revenue) : "—", color: "text-[#22c55e]" },
              { icon: TrendingUp, label: "Open Deals", value: String(customerDeals.filter((d) => !d.isWon && !d.isLost).length), color: "text-[var(--primary)]" },
              { icon: FolderKanban, label: "Projects", value: String(customerProjects.length), color: "text-[#f59e0b]" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon size={16} className={cn("mx-auto mb-1", stat.color)} />
                <p className="text-[18px] font-bold text-[var(--foreground)]">{stat.value}</p>
                <p className="text-[11px] text-[var(--foreground-muted)]">{stat.label}</p>
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

      {/* Tab content */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Company Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Industry", value: customer.industry?.replace("_", " ") ?? "—" },
                  { label: "Employees", value: customer.employeeCount ? `${customer.employeeCount.toLocaleString()}` : "—" },
                  { label: "Annual Revenue", value: customer.revenue ? formatCurrency(customer.revenue) : "—" },
                  { label: "Website", value: customer.website ?? "—" },
                  { label: "Status", value: status.label },
                  { label: "Location", value: customer.address?.city ? `${customer.address.city}, ${customer.address.country}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11.5px] text-[var(--foreground-subtle)] uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-[13px] text-[var(--foreground)] capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent deals */}
            <div className="sos-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13.5px] font-semibold text-[var(--foreground)]">Deals</h3>
                <button className="sos-btn sos-btn-ghost py-1 px-2 text-[12px]">
                  <Plus size={12} /> New Deal
                </button>
              </div>
              {customerDeals.length === 0 ? (
                <p className="text-[13px] text-[var(--foreground-muted)]">No deals yet.</p>
              ) : (
                <div className="space-y-2">
                  {customerDeals.map((deal) => (
                    <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-subtle)] border border-[var(--border)]">
                      <TrendingUp size={14} className="text-[var(--primary)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--foreground)] truncate">{deal.title}</p>
                        <p className="text-[11.5px] text-[var(--foreground-muted)]">{formatCurrency(deal.value)}</p>
                      </div>
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        deal.isWon ? "badge-success" : "badge-primary"
                      )}>
                        {deal.isWon ? "Won" : "Active"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Projects */}
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Projects</h3>
              {customerProjects.length === 0 ? (
                <p className="text-[13px] text-[var(--foreground-muted)]">No projects yet.</p>
              ) : (
                <div className="space-y-2">
                  {customerProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--background-subtle)] transition-colors"
                    >
                      <FolderKanban size={13} className="text-[var(--primary)] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-[var(--foreground)] truncate">{project.name}</p>
                        <p className="text-[11px] text-[var(--foreground-muted)] capitalize">{project.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity */}
            <div className="sos-card p-5">
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {mockActivities.slice(0, 4).map((act) => {
                  const user = getUserById(act.userId);
                  return (
                    <div key={act.id} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5">
                        {user ? getInitials(user.displayName) : "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] text-[var(--foreground)] line-clamp-2">{act.comment ?? act.entityName}</p>
                        <p className="text-[10.5px] text-[var(--foreground-subtle)]">{formatRelativeTime(act.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Contacts" && (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <button className="sos-btn sos-btn-primary">
              <Plus size={13} /> Add Contact
            </button>
          </div>
          {mockContacts.map((contact) => (
            <div key={contact.id} className="sos-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0">
                {getInitials(contact.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13.5px] font-medium text-[var(--foreground)]">{contact.name}</p>
                  {contact.isPrimary && (
                    <span className="text-[10.5px] badge-primary px-1.5 py-0.5 rounded-full font-medium">Primary</span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--foreground-muted)]">{contact.role}</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-[12px] text-[var(--foreground-muted)] hover:text-[var(--primary)]">
                  <Mail size={13} />{contact.email}
                </a>
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-[12px] text-[var(--foreground-muted)] hover:text-[var(--primary)]">
                  <Phone size={13} />{contact.phone}
                </a>
              </div>
              <button className="sos-btn sos-btn-ghost p-1.5">
                <MoreHorizontal size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "Activity" && (
        <div className="sos-card divide-y divide-[var(--border)]">
          {mockActivities.map((act) => {
            const user = getUserById(act.userId);
            return (
              <div key={act.id} className="flex items-start gap-3 p-4">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
                  {user ? getInitials(user.displayName) : "?"}
                </div>
                <div>
                  <p className="text-[13px] text-[var(--foreground)]">
                    <span className="font-medium">{user?.displayName}</span>{" "}
                    <span className="text-[var(--foreground-muted)]">{act.type.replace("_", " ")}</span>{" "}
                    <span className="font-medium">{act.entityName}</span>
                  </p>
                  {act.comment && <p className="text-[12px] text-[var(--foreground-muted)] mt-0.5">{act.comment}</p>}
                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">{formatRelativeTime(act.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "Documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-[var(--foreground)]">Customer Documentation</h3>
              <p className="text-[12px] text-[var(--foreground-muted)]">Wikis, meeting logs, contracts, and SOPs linked to this customer</p>
            </div>
            <Link
              href={`/knowledge?customerId=${customer.id}`}
              className="sos-btn sos-btn-primary py-1.5 px-3 text-[12.5px]"
            >
              <Plus size={12} /> Create Document
            </Link>
          </div>
          {/* List customer documents from knowledge store */}
          <CustomerDocumentsList customerId={customer.id} />
        </div>
      )}

      {(activeTab === "Deals" || activeTab === "Projects" || activeTab === "Files") && (
        <div className="empty-state sos-card">
          <FileText size={36} className="mb-3 opacity-30" />
          <p className="font-medium text-[var(--foreground)]">{activeTab} coming soon</p>
          <p className="text-[13px] mt-1">This section is under development</p>
        </div>
      )}
    </div>
  );
}

function CustomerDocumentsList({ customerId }: { customerId: string }) {
  const { documents, spaces } = useKnowledgeStore();
  const customerDocs = documents.filter((d) => d.customerId === customerId && d.status !== "archived");

  if (customerDocs.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-[var(--border)] rounded-xl bg-[var(--background-subtle)] text-[var(--foreground-subtle)]">
        <FileText size={28} className="mx-auto mb-2 opacity-25 text-[var(--primary)]" />
        <p className="text-[13px] font-semibold text-[var(--foreground)]">No documents linked yet</p>
        <p className="text-[11px] mt-0.5">Link documents to this customer from the Knowledge Hub edit panel.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {customerDocs.map((doc) => {
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
