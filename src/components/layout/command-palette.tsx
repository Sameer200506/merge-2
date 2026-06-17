"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Building2,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Activity,
  Settings,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { mockCustomers, mockDeals, mockProjects, mockTasks } from "@/lib/mock-data";
import { useState } from "react";

const quickLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", group: "Navigation" },
  { href: "/customers", icon: Building2, label: "Customers", group: "Navigation" },
  { href: "/workflow", icon: TrendingUp, label: "Workflow", group: "Navigation" },
  { href: "/projects", icon: FolderKanban, label: "Projects", group: "Navigation" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks", group: "Navigation" },
  { href: "/activity", icon: Activity, label: "Activity Feed", group: "Navigation" },
  { href: "/settings", icon: Settings, label: "Settings", group: "Navigation" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      setCommandOpen(false);
      setQuery("");
    },
    [router, setCommandOpen]
  );

  if (!commandOpen) return null;

  // Filter results
  const q = query.toLowerCase();
  const filteredLinks = quickLinks.filter((l) => l.label.toLowerCase().includes(q));
  const filteredCustomers = q
    ? mockCustomers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const filteredDeals = q
    ? mockDeals.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const filteredProjects = q
    ? mockProjects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 3)
    : [];
  const filteredTasks = q
    ? mockTasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 3)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setCommandOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full max-w-[560px] mx-4 rounded-xl overflow-hidden",
          "glass animate-scale-in",
          "shadow-2xl border border-[var(--border-strong)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search size={16} className="text-[var(--foreground-muted)] flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, deals, projects, tasks..."
            className="flex-1 bg-transparent text-[14px] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] outline-none"
          />
          <kbd className="text-[11px] font-mono text-[var(--foreground-subtle)] bg-[var(--background-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {!q && (
            <div className="px-3 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] px-1 mb-1">
                Quick Navigation
              </p>
              {filteredLinks.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleSelect(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px]",
                    "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)]",
                    "hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  )}
                >
                  <item.icon size={15} className="flex-shrink-0" />
                  {item.label}
                  <ArrowRight size={13} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
          )}

          {q && (
            <div className="px-3 space-y-3">
              {filteredCustomers.length > 0 && (
                <ResultGroup
                  title="Customers"
                  items={filteredCustomers.map((c) => ({
                    label: c.name,
                    sub: c.website ?? "",
                    href: `/customers/${c.id}`,
                    icon: Building2,
                  }))}
                  onSelect={handleSelect}
                />
              )}
              {filteredDeals.length > 0 && (
                <ResultGroup
                  title="Deals"
                  items={filteredDeals.map((d) => ({
                    label: d.title,
                    sub: `$${d.value.toLocaleString()}`,
                    href: `/workflow`,
                    icon: TrendingUp,
                  }))}
                  onSelect={handleSelect}
                />
              )}
              {filteredProjects.length > 0 && (
                <ResultGroup
                  title="Projects"
                  items={filteredProjects.map((p) => ({
                    label: p.name,
                    sub: p.status,
                    href: `/projects/${p.id}`,
                    icon: FolderKanban,
                  }))}
                  onSelect={handleSelect}
                />
              )}
              {filteredTasks.length > 0 && (
                <ResultGroup
                  title="Tasks"
                  items={filteredTasks.map((t) => ({
                    label: t.title,
                    sub: t.status,
                    href: `/tasks`,
                    icon: CheckSquare,
                  }))}
                  onSelect={handleSelect}
                />
              )}
              {filteredCustomers.length === 0 &&
                filteredDeals.length === 0 &&
                filteredProjects.length === 0 &&
                filteredTasks.length === 0 && (
                  <div className="py-8 text-center text-[var(--foreground-muted)] text-[13px]">
                    No results for &quot;{query}&quot;
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--border)] text-[11px] text-[var(--foreground-subtle)]">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

interface ResultItem {
  label: string;
  sub: string;
  href: string;
  icon: React.ElementType;
}

function ResultGroup({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: ResultItem[];
  onSelect: (href: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] px-1 mb-1">
        {title}
      </p>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onSelect(item.href)}
          className={cn(
            "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-[13.5px]",
            "hover:bg-[var(--background-muted)] transition-colors cursor-pointer"
          )}
        >
          <item.icon size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
          <div className="text-left min-w-0">
            <p className="text-[var(--foreground)] truncate">{item.label}</p>
            <p className="text-[11px] text-[var(--foreground-subtle)] truncate capitalize">{item.sub}</p>
          </div>
          <ArrowRight size={12} className="ml-auto text-[var(--foreground-subtle)] opacity-60" />
        </button>
      ))}
    </div>
  );
}
