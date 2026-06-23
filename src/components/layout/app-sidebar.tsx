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
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { getInitials } from "@/lib/utils";
import { NewDealSheet } from "@/components/shared/new-deal-sheet";




interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active: boolean;
  badgeCount?: number;
  onClick?: (e: React.MouseEvent) => void;
}

function SidebarItem({ href, icon: Icon, label, collapsed, active, badgeCount, onClick }: SidebarItemProps) {
  const badgeEl = badgeCount && badgeCount > 0 ? (
    <span className={cn(
      "rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 transition-all",
      collapsed ? "absolute top-1 right-1 w-2.5 h-2.5 text-[0px] overflow-hidden" : "w-4 h-4 ml-auto"
    )}>
      {collapsed ? "" : badgeCount}
    </span>
  ) : null;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "sos-sidebar-item w-full text-left cursor-pointer relative",
          active && "active",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon size={16} className="flex-shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
        {badgeEl}
      </button>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "sos-sidebar-item relative",
        active && "active",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={16} className="flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
      {badgeEl}
    </Link>
  );
}

const RESTRICTED_ROUTES: Record<string, string[]> = {
  sales_manager: ["/projects", "/tasks", "/settings/billing"],
  project_manager: ["/leads", "/customers", "/workflow", "/settings/billing"],
  team_member: [
    "/leads",
    "/customers",
    "/workflow",
    "/settings/organization",
    "/settings/members",
    "/settings/billing",
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, sidebarOpen, toggleSidebar } = useUIStore();
  const { user, organization } = useAuthStore();
  const { isOpen: chatIsOpen, setIsOpen: setChatIsOpen, messages, lastReadTimes } = useChatStore();
  const unreadChatCount = user ? messages.filter((msg) => {
    if (msg.senderId === user.id) return false;
    if (!msg.recipientId) {
      const lastRead = lastReadTimes["public"];
      if (!lastRead) return true;
      return new Date(msg.timestamp).getTime() > new Date(lastRead).getTime();
    } else if (msg.recipientId === user.id) {
      const lastRead = lastReadTimes[`private:${msg.senderId}`];
      if (!lastRead) return true;
      return new Date(msg.timestamp).getTime() > new Date(lastRead).getTime();
    }
    return false;
  }).length : 0;
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const showNewDeal = user?.role === "owner" || user?.role === "sales_manager";

  // Dynamic nav groups — Payments href differs by role
  const paymentsHref = user?.role === "owner" ? "/payments" : "/payments/status";

  const allNavGroups = [
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
        { href: "/workflow", icon: TrendingUp, label: "Workflow" },
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
        { href: paymentsHref, icon: Wallet, label: "Payments" },
        { href: "/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  const visibleNavGroups = allNavGroups.map((group) => {
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
    // Both /payments and /payments/status should match the /payments prefix
    if (href === "/payments" || href === "/payments/status") return pathname.startsWith("/payments");
    return pathname.startsWith(href);
  };

  const collapsed = !mounted ? true : (!isMobile && sidebarCollapsed && !isHovered);


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
          "fixed inset-y-0 left-0 md:relative z-50 md:z-auto h-full",
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
                      badgeCount={isChat ? unreadChatCount : undefined}
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
