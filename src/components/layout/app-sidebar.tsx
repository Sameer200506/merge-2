"use client";

import { useState, useEffect } from "react";
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
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { getInitials } from "@/lib/utils";
import { NewDealSheet } from "@/components/shared/new-deal-sheet";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/leads", icon: Target, label: "Leads" },
      { href: "#chat", icon: MessageSquare, label: "Chat" },
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
  onClick?: (e: React.MouseEvent) => void;
}

function SidebarItem({ href, icon: Icon, label, collapsed, active, onClick }: SidebarItemProps) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "sos-sidebar-item w-full text-left cursor-pointer",
          active && "active",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </button>
    );
  }
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

const RESTRICTED_ROUTES: Record<string, string[]> = {
  sales_manager: ["/projects", "/tasks", "/settings/billing"],
  project_manager: ["/leads", "/customers", "/pipeline", "/settings/billing"],
  team_member: [
    "/leads",
    "/customers",
    "/pipeline",
    "/settings/organization",
    "/settings/members",
    "/settings/billing",
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const { user, organization } = useAuthStore();
  const { isOpen: chatIsOpen, setIsOpen: setChatIsOpen } = useChatStore();
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNewDeal = user?.role === "owner" || user?.role === "sales_manager";

  const visibleNavGroups = navGroups.map((group) => {
    const visibleItems = group.items.filter((item) => {
      if (user) {
        const roleRestrictions = RESTRICTED_ROUTES[user.role] || [];
        return !roleRestrictions.some((route) => item.href.startsWith(route));
      }
      return true;
    });
    return { ...group, items: visibleItems };
  }).filter((group) => group.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const collapsed = !mounted ? true : (sidebarCollapsed && !isHovered);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768 && sidebarOpen) {
      toggleSidebar();
    }
  }, [pathname]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in"
          onClick={toggleSidebar}
        />
      )}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "sos-sidebar flex flex-col transition-all duration-300 ease-in-out",
          "fixed md:relative z-50 md:z-auto h-full",
          !sidebarOpen && "-translate-x-full md:translate-x-0",
          collapsed ? "w-[52px]" : "w-[220px]"
        )}
        style={{ minHeight: "100dvh" }}
      >
        {/* Logo / Org */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-3 py-4 border-b",
            "border-[var(--sidebar-border)]",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Zap size={14} className="text-white" />
          </div>
          {!collapsed && (
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
        {showNewDeal && (
          !collapsed ? (
            <div className="px-2 pt-3 pb-1">
              <button
                onClick={() => setNewDealOpen(true)}
                className="sos-btn sos-btn-primary w-full text-[13px] py-1.5 cursor-pointer"
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
                className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white hover:opacity-90 transition-opacity cursor-pointer"
                title="New Deal"
                aria-label="New Deal"
              >
                <Plus size={15} />
              </button>
            </div>
          )
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {visibleNavGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10.5px] font-600 uppercase tracking-widest text-[var(--foreground-subtle)] px-2 mb-1 font-semibold">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isChat = item.href === "#chat";
                  return (
                    <SidebarItem
                      key={item.href}
                      {...item}
                      collapsed={collapsed}
                      active={isChat ? chatIsOpen : isActive(item.href)}
                      onClick={isChat ? (e) => {
                        e.preventDefault();
                        setChatIsOpen(true);
                      } : undefined}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div
          className={cn(
            "border-t border-[var(--sidebar-border)] px-2 py-3",
            collapsed ? "flex justify-center" : "flex items-center gap-2.5"
          )}
        >
          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
            {user ? getInitials(user.displayName) : "U"}
          </div>
          {!collapsed && user && (
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
      </aside>

      {/* New Deal Sheet — rendered outside sidebar so it covers full screen */}
      <NewDealSheet open={newDealOpen} onClose={() => setNewDealOpen(false)} />
    </>
  );
}
