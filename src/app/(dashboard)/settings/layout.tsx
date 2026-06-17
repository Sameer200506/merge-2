"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Building2,
  Users,
  CreditCard,
  Bell,
  Sliders,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";

const settingsNav = [
  { href: "/settings/profile", icon: User, label: "Profile" },
  { href: "/settings/organization", icon: Building2, label: "Organization" },
  { href: "/settings/members", icon: Users, label: "Members & Roles" },
  { href: "/settings/billing", icon: CreditCard, label: "Billing" },
];

const RESTRICTED_ROUTES: Record<string, string[]> = {
  sales_manager: ["/settings/billing"],
  project_manager: ["/settings/billing"],
  team_member: ["/settings/organization", "/settings/members", "/settings/billing"],
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const roleRestrictions = RESTRICTED_ROUTES[user?.role || ""] || [];
  const visibleNav = settingsNav.filter((item) => !roleRestrictions.includes(item.href));

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-0.5">
            Manage your organization and account preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="sos-card p-2 space-y-0.5">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "sos-sidebar-item",
                  pathname === item.href && "active"
                )}
              >
                <item.icon size={15} />
                {item.label}
                <ChevronRight size={13} className="ml-auto opacity-50" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
