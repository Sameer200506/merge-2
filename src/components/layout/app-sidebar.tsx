"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plus,
  Building2,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { getInitials } from "@/lib/utils";
import { NewDealSheet } from "@/components/shared/new-deal-sheet";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/leads", icon: Target, label: "Leads" },
      { href: "/activity", icon: Activity, label: "Activity" },
    ],
  },
  {
    label: "CRM",
    items: [
      { href: "/customers", icon: Building2, label: "Customers" },
      { href: "/pipeline", icon: TrendingUp, label: "Pipeline" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/projects", icon: FolderKanban, label: "Projects" },
      { href: "/tasks", icon: CheckSquare, label: "Tasks" },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
}

function SidebarItem({ href, icon: Icon, label, collapsed, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "sos-sidebar-item",
        active && "active",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { user, organization } = useAuthStore();
  const [newDealOpen, setNewDealOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className={cn(
          "sos-sidebar flex flex-col transition-all duration-200 ease-in-out relative",
          sidebarCollapsed ? "w-[52px]" : "w-[220px]"
        )}
        style={{ minHeight: "100dvh" }}
      >
        {/* Logo / Org */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-4 border-b",
            "border-[var(--sidebar-border)]",
            sidebarCollapsed && "justify-center px-2"
          )}
        >
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-700 text-[var(--foreground)] truncate leading-tight font-semibold">
                {organization?.name ?? "StartupOS"}
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] truncate leading-tight capitalize">
                {organization?.plan ?? "growth"} plan
              </p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {!sidebarCollapsed ? (
          <div className="px-2 pt-3 pb-1">
            <button
              onClick={() => setNewDealOpen(true)}
              className="sos-btn sos-btn-primary w-full text-[13px] py-1.5"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Plus size={14} />
              New Deal
            </button>
          </div>
        ) : (
          <div className="px-1.5 pt-3 pb-1 flex justify-center">
            <button
              onClick={() => setNewDealOpen(true)}
              className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              title="New Deal"
              aria-label="New Deal"
            >
              <Plus size={15} />
            </button>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="text-[10.5px] font-600 uppercase tracking-widest text-[var(--foreground-subtle)] px-2 mb-1 font-semibold">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    {...item}
                    collapsed={sidebarCollapsed}
                    active={isActive(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div
          className={cn(
            "border-t border-[var(--sidebar-border)] px-2 py-3",
            sidebarCollapsed ? "flex justify-center" : "flex items-center gap-2.5"
          )}
        >
          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
            {user ? getInitials(user.displayName) : "U"}
          </div>
          {!sidebarCollapsed && user && (
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-[var(--foreground)] truncate">
                {user.displayName}
              </p>
              <p className="text-[11px] text-[var(--foreground-subtle)] truncate capitalize">
                {user.role.replace("_", " ")}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "absolute -right-3 top-[72px] w-6 h-6 rounded-full",
            "bg-[var(--card)] border border-[var(--border-strong)]",
            "flex items-center justify-center",
            "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            "shadow-sm transition-all hover:shadow-md z-10"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* New Deal Sheet — rendered outside sidebar so it covers full screen */}
      <NewDealSheet open={newDealOpen} onClose={() => setNewDealOpen(false)} />
    </>
  );
}
