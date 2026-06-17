"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useShiftsStore } from "@/stores/shifts.store";
import { ShieldAlert, Loader2, Home } from "lucide-react";
import Link from "next/link";

// Route accessibility rules by role
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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { activeShifts, tick } = useShiftsStore();
  const [mounted, setMounted] = useState(false);

  const hasActiveShifts = activeShifts.length > 0;

  // Global Shift Ticker: fires every second when there are active shifts
  useEffect(() => {
    if (!hasActiveShifts) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [hasActiveShifts, tick]);

  // Mount check to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle redirects
  useEffect(() => {
    if (!mounted || isLoading) return;

    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    } else if (isAuthenticated && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, mounted, isLoading, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0f19] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
          <span className="text-[13px] text-slate-400 font-medium">Loading StartupOS...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated and not on the login page, show loading spinner while redirecting
  if (!isAuthenticated && pathname !== "/login") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0f19]" />
    );
  }

  // If authenticated, check role restrictions
  if (isAuthenticated && user) {
    const roleRestrictions = RESTRICTED_ROUTES[user.role] || [];
    const isRestricted = roleRestrictions.some((route) => pathname.startsWith(route));

    if (isRestricted) {
      return (
        <div className="flex items-center justify-center min-h-[70vh] p-6 text-center select-none text-[var(--foreground)]">
          <div className="sos-card max-w-[440px] p-8 flex flex-col items-center space-y-5 border-[var(--border-strong)]">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[var(--foreground)]">Access Denied</h2>
              <p className="text-[12.5px] text-[var(--foreground-muted)] mt-2 leading-relaxed">
                Your account type (<span className="font-semibold capitalize">{user.role.replace("_", " ")}</span>) does not have permission to view <code className="font-mono bg-[var(--background-muted)] px-1.5 py-0.5 rounded text-[11.5px]">{pathname}</code>.
              </p>
            </div>
            <div className="w-full pt-2">
              <Link
                href="/dashboard"
                className="sos-btn sos-btn-primary w-full py-2 flex items-center justify-center gap-2 text-[12.5px] cursor-pointer"
              >
                <Home size={14} />
                Return to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
