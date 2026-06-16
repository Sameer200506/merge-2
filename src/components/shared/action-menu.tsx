"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionMenuItem {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  danger?: boolean;
}

export function ActionMenu({ actions }: { actions: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAction = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation();
    fn();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "sos-btn sos-btn-ghost p-1 rounded-md transition-colors",
          open && "bg-[var(--background-muted)]"
        )}
        aria-label="Actions"
      >
        <MoreHorizontal size={13} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className={cn(
            "absolute right-0 top-[calc(100%+4px)] w-[160px] z-[60]",
            "bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl",
            "animate-scale-in origin-top-right py-1 flex flex-col"
          )}
        >
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={(e) => handleAction(e, action.onClick)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] transition-colors w-full text-left",
                  action.danger
                    ? "text-[var(--danger)] hover:bg-[var(--danger-subtle)]"
                    : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-subtle)]"
                )}
              >
                <Icon size={13} className="flex-shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
