"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  Check,
  X,
  Zap,
  CheckCircle2,
  TrendingUp,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { mockNotifications } from "@/lib/mock-data";
import { getInitials, formatRelativeTime } from "@/lib/utils";

// ── Breadcrumb ────────────────────────────────────────────────
const breadcrumbMap: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  pipeline: "Pipeline",
  projects: "Projects",
  tasks: "Tasks",
  activity: "Activity",
  settings: "Settings",
  profile: "Profile",
  organization: "Organization",
  members: "Members",
  billing: "Billing",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-[13px]">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = breadcrumbMap[seg] ?? seg;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-[var(--foreground-subtle)]" />}
            <span className={cn(isLast ? "text-[var(--foreground)] font-medium" : "text-[var(--foreground-subtle)]")}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

// ── Notifications Panel ───────────────────────────────────────
const notifIconMap: Record<string, React.ElementType> = {
  deal_won: TrendingUp,
  task_assigned: CheckCircle2,
  project_update: FolderKanban,
  mention: User,
  system: Zap,
};

function NotificationsPanel({
  open,
  onClose,
  anchorRef,
  notifications,
  onMarkAllRead,
  onClearAll,
  onClearNotif,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  notifications: typeof mockNotifications;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onClearNotif: (id: string) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const unread = notifications.filter((n) => !n.isRead);
  const allNotifs = notifications;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] w-[340px] z-50",
        "bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl",
        "animate-scale-in origin-top-right"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <h3 className="text-[13.5px] font-semibold text-[var(--foreground)]">Notifications</h3>
          {unread.length > 0 && (
            <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white">
              {unread.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={onMarkAllRead} className="text-[11.5px] text-[var(--primary)] hover:underline">
              Mark all read
            </button>
          )}
          {allNotifs.length > 0 && (
            <button onClick={onClearAll} className="text-[11.5px] text-[var(--foreground-muted)] hover:text-[var(--danger)] hover:underline">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="sos-btn sos-btn-ghost p-1">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border)]">
        {allNotifs.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[var(--foreground-muted)]">
            You're all caught up!
          </div>
        ) : (
          allNotifs.map((notif) => {
            const Icon = notifIconMap[notif.type] ?? Zap;
            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 hover:bg-[var(--background-subtle)] transition-colors cursor-pointer",
                  !notif.isRead && "bg-[var(--primary-subtle)]"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  !notif.isRead ? "gradient-primary" : "bg-[var(--background-muted)]"
                )}>
                  <Icon size={14} className={notif.isRead ? "text-[var(--foreground-muted)]" : "text-white"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--foreground)] leading-snug">{notif.title}</p>
                  <p className="text-[12px] text-[var(--foreground-muted)] mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearNotif(notif.id);
                    }}
                    className="text-[var(--foreground-subtle)] hover:text-[var(--danger)] p-0.5 rounded transition-colors"
                    aria-label="Remove notification"
                  >
                    <X size={13} />
                  </button>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--border)]">
        <Link
          href="/activity"
          onClick={onClose}
          className="text-[12.5px] text-[var(--primary)] hover:underline block text-center"
        >
          View all activity →
        </Link>
      </div>
    </div>
  );
}

// ── User Menu ─────────────────────────────────────────────────
function UserMenu({
  open,
  onClose,
  anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const { user, organization } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const menuItems = [
    { icon: User, label: "Profile", href: "/settings/profile" },
    { icon: Settings, label: "Settings", href: "/settings/organization" },
    { icon: Shield, label: "Members & Roles", href: "/settings/members" },
    { icon: CreditCard, label: "Billing", href: "/settings/billing" },
  ];

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] w-[240px] z-50",
        "bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl",
        "animate-scale-in origin-top-right"
      )}
    >
      {/* Profile header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
            {user ? getInitials(user.displayName) : "U"}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[var(--foreground)] truncate">{user?.displayName}</p>
            <p className="text-[11.5px] text-[var(--foreground-muted)] truncate">{user?.email}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Zap size={11} className="text-[var(--primary)]" />
          <span className="text-[11px] text-[var(--foreground-subtle)] capitalize">
            {organization?.name} · {organization?.plan} plan
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="py-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--foreground-muted)] hover:bg-[var(--background-subtle)] hover:text-[var(--foreground)] transition-colors"
          >
            <item.icon size={14} className="flex-shrink-0" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Theme toggle */}
      <div className="px-4 py-2 border-t border-[var(--border)]">
        <button
          onClick={() => { toggleTheme(); }}
          className="w-full flex items-center justify-between text-[13px] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors py-1"
        >
          <div className="flex items-center gap-2.5">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </div>
          <div className={cn(
            "w-8 h-4 rounded-full transition-colors flex items-center px-0.5",
            theme === "dark" ? "bg-[var(--primary)]" : "bg-[var(--background-muted)] border border-[var(--border)]"
          )}>
            <div className={cn(
              "w-3 h-3 rounded-full bg-white shadow-sm transition-transform",
              theme === "dark" ? "translate-x-4" : "translate-x-0"
            )} />
          </div>
        </button>
      </div>

      {/* Sign out */}
      <div className="py-1 border-t border-[var(--border)]">
        <button
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── App Header ────────────────────────────────────────────────
export function AppHeader() {
  const { setCommandOpen, toggleSidebar } = useUIStore();
  const { theme } = useUIStore();
  const { user } = useAuthStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const notifRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleNotif = () => {
    setUserMenuOpen(false);
    setNotifOpen((v) => !v);
  };

  const toggleUserMenu = () => {
    setNotifOpen(false);
    setUserMenuOpen((v) => !v);
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const clearNotif = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <header
      className={cn(
        "h-12 flex items-center justify-between px-4 flex-shrink-0",
        "border-b border-[var(--border)] bg-[var(--background)]",
        "sticky top-0 z-30"
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="sos-btn sos-btn-ghost p-1.5 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={16} />
        </button>
        <Breadcrumb />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Search — desktop */}
        <button
          onClick={() => setCommandOpen(true)}
          className={cn(
            "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px]",
            "text-[var(--foreground-muted)] bg-[var(--background-muted)]",
            "border border-[var(--border)] hover:border-[var(--border-strong)]",
            "transition-all cursor-pointer"
          )}
          aria-label="Search"
        >
          <Search size={13} />
          <span>Search...</span>
          <kbd className="ml-2 text-[11px] font-mono bg-[var(--background)] border border-[var(--border)] px-1 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Search icon — mobile */}
        <button
          onClick={() => setCommandOpen(true)}
          className="sos-btn sos-btn-ghost p-1.5 sm:!hidden"
          aria-label="Search"
        >
          <Search size={16} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            ref={notifRef}
            onClick={toggleNotif}
            className={cn(
              "sos-btn sos-btn-ghost p-1.5 relative",
              notifOpen && "bg-[var(--background-muted)]"
            )}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className={cn(
                "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full",
                "bg-[var(--danger)] text-white text-[9px] font-bold",
                "flex items-center justify-center"
              )}>
                {unreadCount}
              </span>
            )}
          </button>
          <NotificationsPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            anchorRef={notifRef}
            notifications={notifications}
            onMarkAllRead={markAllRead}
            onClearAll={clearAll}
            onClearNotif={clearNotif}
          />
        </div>

        {/* User avatar */}
        <div className="relative">
          <button
            ref={avatarRef}
            onClick={toggleUserMenu}
            className={cn(
              "w-7 h-7 rounded-full gradient-primary flex items-center justify-center",
              "text-[11px] font-semibold text-white flex-shrink-0 ml-1",
              "hover:opacity-90 transition-opacity ring-2 ring-transparent",
              userMenuOpen && "ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background)]"
            )}
            aria-label="User menu"
          >
            {user ? getInitials(user.displayName) : "U"}
          </button>
          <UserMenu
            open={userMenuOpen}
            onClose={() => setUserMenuOpen(false)}
            anchorRef={avatarRef}
          />
        </div>
      </div>
    </header>
  );
}
