"use client";

import { useState } from "react";
import { X, History, RotateCcw, AlertTriangle, ChevronRight, Eye } from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { useAuthStore } from "@/stores/auth.store";
import { mockUsers } from "@/lib/mock-data";
import { getInitials, formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentVersion, ID } from "@/types";

interface VersionHistorySidebarProps {
  documentId: ID;
  onClose: () => void;
  onSelectPreviewVersion: (version: DocumentVersion | null) => void;
  selectedPreviewVersion: DocumentVersion | null;
}

export function VersionHistorySidebar({
  documentId,
  onClose,
  onSelectPreviewVersion,
  selectedPreviewVersion,
}: VersionHistorySidebarProps) {
  const { versions, rollbackDocument } = useKnowledgeStore();
  const { user: currentUser } = useAuthStore();

  const docVersions = versions
    .filter((v) => v.documentId === documentId)
    .sort((a, b) => b.versionNumber - a.versionNumber); // Newest first

  const handleRollback = async (version: DocumentVersion) => {
    if (!currentUser) return;

    const confirm = window.confirm(
      `Are you sure you want to rollback to revision #${version.versionNumber}? This will create a new revision.`
    );
    if (!confirm) return;

    try {
      await rollbackDocument(documentId, version, currentUser.id);
      onSelectPreviewVersion(null);
      toast.success(`Document restored to revision #${version.versionNumber}!`);
    } catch (e) {
      toast.error("Failed to restore version");
    }
  };

  return (
    <div className="w-[320px] border-l border-[var(--border)] bg-[var(--card)] flex flex-col h-full z-10 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-subtle)]">
        <div className="flex items-center gap-2 text-[var(--foreground)] font-semibold text-[13.5px]">
          <History size={14} className="text-[var(--primary)]" />
          <span>Version History ({docVersions.length})</span>
        </div>
        <button onClick={onClose} className="sos-btn sos-btn-ghost p-1">
          <X size={15} />
        </button>
      </div>

      {/* Info notice about Preview mode */}
      {selectedPreviewVersion && (
        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border-b border-[var(--border)] text-[11.5px] text-amber-800 dark:text-amber-300 flex items-start gap-2 animate-fade-in font-medium">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>
              Viewing <strong>Revision #{selectedPreviewVersion.versionNumber}</strong> preview
            </p>
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => handleRollback(selectedPreviewVersion)}
                className="flex items-center gap-0.5 text-xs text-[#22c55e] font-bold hover:underline cursor-pointer"
              >
                <RotateCcw size={11} /> Restore
              </button>
              <button
                onClick={() => onSelectPreviewVersion(null)}
                className="text-xs text-[var(--foreground-muted)] hover:underline cursor-pointer"
              >
                Exit Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        <div className="absolute left-[30px] top-6 bottom-6 w-[1.5px] bg-[var(--border)]" />
        
        {docVersions.length === 0 ? (
          <div className="py-12 text-center text-[var(--foreground-subtle)] relative z-10">
            <History size={26} className="mx-auto mb-2 opacity-25" />
            <p className="text-[12.5px] font-medium">No history log found</p>
          </div>
        ) : (
          docVersions.map((version, index) => {
            const editor = mockUsers.find((u) => u.id === version.editorId);
            const isLatest = index === 0 && !selectedPreviewVersion;
            const isSelected = selectedPreviewVersion?.id === version.id;

            return (
              <div
                key={version.id}
                onClick={() => onSelectPreviewVersion(isSelected ? null : version)}
                className={cn(
                  "flex items-start gap-4 relative z-10 p-2.5 rounded-xl border transition-all cursor-pointer",
                  isSelected
                    ? "bg-amber-50/30 border-amber-300 dark:bg-amber-950/10 dark:border-amber-900"
                    : isLatest
                    ? "bg-indigo-50/20 border-indigo-200 dark:bg-indigo-950/5 dark:border-indigo-900"
                    : "bg-[var(--card)] border-transparent hover:border-[var(--border)] hover:bg-[var(--background-subtle)]"
                )}
              >
                {/* Timeline Dot Indicator */}
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1.5",
                    isSelected
                      ? "bg-amber-400 border-amber-600 dark:bg-amber-500"
                      : isLatest
                      ? "bg-indigo-500 border-indigo-600"
                      : "bg-[var(--card)] border-[var(--border-strong)]"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isLatest ? "bg-white" : isSelected ? "bg-white" : "bg-[var(--foreground-subtle)]"
                    )}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-[var(--foreground)]">
                      Revision #{version.versionNumber}
                    </span>
                    {index === 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[var(--primary)] border border-indigo-150 dark:bg-indigo-950/20 select-none">
                        LATEST
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                    {formatDate(version.timestamp)} · {formatRelativeTime(version.timestamp)}
                  </p>

                  {version.changeSummary && (
                    <p className="text-[11.5px] text-[var(--foreground-muted)] font-medium mt-1.5 whitespace-pre-wrap leading-normal">
                      {version.changeSummary}
                    </p>
                  )}

                  {/* Editor Info */}
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[var(--border)]">
                    <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-white">
                      {editor ? getInitials(editor.displayName) : "?"}
                    </div>
                    <span className="text-[10px] text-[var(--foreground-muted)] truncate">
                      {editor?.displayName || "Unknown Editor"}
                    </span>

                    {/* Preview action indicator */}
                    <div className="ml-auto text-[var(--foreground-subtle)] flex items-center gap-0.5 text-[9px] font-medium opacity-60 group-hover:opacity-100">
                      <Eye size={9} /> Preview
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
