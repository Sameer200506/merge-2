"use client";

import { useState } from "react";
import {
  Folder,
  FileText,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ChevronLeft,
  Search,
  BookOpen,
  Pencil,
  Trash2,
  Archive,
  Book,
  Palette,
  Paperclip,
} from "lucide-react";
import { ActionMenu } from "@/components/shared/action-menu";
import type { Space, Document, ID } from "@/types";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { PermissionsModal } from "./permissions-modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SpaceSidebarProps {
  space: Space;
  documents: Document[];
  activeDocId?: ID;
  onSearchOpen: () => void;
}

interface TreeNodeProps {
  doc: Document;
  allDocs: Document[];
  activeDocId?: ID;
  depth: number;
  expandedNodes: Record<string, boolean>;
  toggleNode: (id: string) => void;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string, type: "document" | "whiteboard" | "file") => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

function TreeNode({
  doc,
  allDocs,
  activeDocId,
  depth,
  expandedNodes,
  toggleNode,
  onSelect,
  onAddChild,
  onDelete,
  onArchive,
}: TreeNodeProps) {
  const children = allDocs
    .filter((d) => d.parentId === doc.id && d.status !== "archived")
    .sort((a, b) => a.order - b.order);

  const isExpanded = expandedNodes[doc.id] || false;
  const isActive = activeDocId === doc.id;
  const hasChildren = children.length > 0;

  return (
    <div className="space-y-0.5">
      {/* Node Row */}
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group text-[13px] relative",
          isActive
            ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-text)] font-medium"
            : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--sidebar-item-hover)]"
        )}
        style={{ paddingLeft: `${Math.max(8, depth * 14)}px` }}
        onClick={() => onSelect(doc.id)}
      >
        {/* Toggle Expand Arrow */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(doc.id);
            }}
            className="p-0.5 hover:bg-[var(--background-muted)] rounded text-[var(--foreground-subtle)]"
          >
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        ) : (
          <div className="w-[15px]" />
        )}

        {/* Page Icon */}
        {doc.type === "whiteboard" ? (
          <Palette size={13} className={cn("text-purple-500 opacity-80 flex-shrink-0", isActive && "text-[var(--sidebar-item-active-text)]")} />
        ) : doc.type === "file" ? (
          <Paperclip size={13} className={cn("text-emerald-500 opacity-80 flex-shrink-0", isActive && "text-[var(--sidebar-item-active-text)]")} />
        ) : hasChildren ? (
          <Folder size={13} className={cn("text-[#f59e0b] opacity-80 flex-shrink-0", isActive && "text-[var(--sidebar-item-active-text)]")} />
        ) : (
          <FileText size={13} className={cn("text-[var(--primary)] opacity-70 flex-shrink-0", isActive && "text-[var(--sidebar-item-active-text)]")} />
        )}

        {/* Title */}
        <span className="truncate flex-1 min-w-0 pr-6">
          {doc.title}
          {doc.status === "draft" && (
            <span className="ml-1.5 text-[9px] uppercase font-bold px-1 rounded bg-[var(--background-muted)] text-[var(--foreground-subtle)] border border-[var(--border)]">
              Draft
            </span>
          )}
        </span>

        {/* Action Menu (Visible on hover) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ActionMenu
            actions={[
              {
                label: "Add Child Page",
                icon: FileText,
                onClick: () => onAddChild(doc.id, "document"),
              },
              {
                label: "Add Whiteboard",
                icon: Palette,
                onClick: () => onAddChild(doc.id, "whiteboard"),
              },
              {
                label: "Upload File",
                icon: Paperclip,
                onClick: () => onAddChild(doc.id, "file"),
              },
              {
                label: "Archive Item",
                icon: Archive,
                onClick: () => onArchive(doc.id),
              },
              {
                label: "Delete Item",
                icon: Trash2,
                danger: true,
                onClick: () => onDelete(doc.id),
              },
            ]}
          />
        </div>
      </div>

      {/* Children list */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              doc={child}
              allDocs={allDocs}
              activeDocId={activeDocId}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onArchive={onArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SpaceSidebar({ space, documents, activeDocId, onSearchOpen }: SpaceSidebarProps) {
  const router = useRouter();
  const { addDocument, deleteDocument, archiveDocument } = useKnowledgeStore();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Get only top-level (root) documents of this space
  const rootDocs = documents
    .filter((d) => d.spaceId === space.id && d.parentId === null && d.status !== "archived")
    .sort((a, b) => a.order - b.order);

  const handleSelectPage = (id: ID) => {
    router.push(`/knowledge/space/${space.id}/${id}`);
  };

  const handleCreateRootPage = async (type: "document" | "whiteboard" | "file" = "document") => {
    if (type === "file") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const text = evt.target?.result as string;
            await createFileDoc(file.name, file.type, file.size, text, null);
          };
          reader.readAsText(file);
        } else {
          let mockOCR = `Simulated OCR/Text extraction for ${file.name}.\n`;
          if (file.name.toLowerCase().includes("stripe")) {
            mockOCR += "Stripe webhook flow mapping. Highlights client payments processing, invoice settlement logic, and checkout payment success notification handlers. Verifies signature using secret keys.";
          } else if (file.name.toLowerCase().includes("financial")) {
            mockOCR += "StartupOS financial report Q1 2026. Total revenue $1,540,000, net profit $462,000. Customer acquisition cost $120. Runway estimated at 24 months.";
          } else {
            mockOCR += `Full text content extracted from document. Keyword search is fully indexed for search results. Matches filename ${file.name}.`;
          }
          await createFileDoc(file.name, file.type, file.size, mockOCR, null);
        }
      };
      fileInput.click();
      return;
    }

    try {
      const newId = await addDocument({
        title: type === "whiteboard" ? "Untitled Whiteboard" : "Untitled Page",
        content: type === "whiteboard" ? "Whiteboard Canvas" : "<h1>Untitled Page</h1><p>Start writing here...</p>",
        authorId: "user_1",
        spaceId: space.id,
        tags: [],
        status: "draft",
        parentId: null,
        order: rootDocs.length,
        type,
        canvasData: type === "whiteboard" ? JSON.stringify([]) : undefined,
        icon: type === "whiteboard" ? "🎨" : undefined,
      });
      router.push(`/knowledge/space/${space.id}/${newId}?edit=true`);
      toast.success(`${type === "whiteboard" ? "Whiteboard" : "Document"} draft created!`);
    } catch (e) {
      toast.error("Failed to create document");
    }
  };

  const createFileDoc = async (fileName: string, fileType: string, fileSize: number, fileText: string, parentId: string | null) => {
    try {
      const newId = await addDocument({
        title: fileName,
        content: fileText,
        authorId: "user_1",
        spaceId: space.id,
        tags: ["uploaded"],
        status: "published",
        parentId,
        order: documents.filter((d) => d.parentId === parentId && d.spaceId === space.id).length,
        type: "file",
        fileUrl: "#",
        fileSize: (fileSize / 1024).toFixed(0) + " KB",
        fileType,
        icon: fileType.startsWith("image/") ? "🖼️" : "📄",
      });
      router.push(`/knowledge/space/${space.id}/${newId}`);
      toast.success(`File "${fileName}" uploaded and indexed!`);
    } catch (e) {
      toast.error("Failed to upload file");
    }
  };

  const handleCreateChildPage = async (parentId: string, type: "document" | "whiteboard" | "file" = "document") => {
    setExpandedNodes((prev) => ({ ...prev, [parentId]: true }));

    if (type === "file") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const text = evt.target?.result as string;
            await createFileDoc(file.name, file.type, file.size, text, parentId);
          };
          reader.readAsText(file);
        } else {
          let mockOCR = `Simulated OCR/Text extraction for ${file.name}.\n`;
          if (file.name.toLowerCase().includes("stripe")) {
            mockOCR += "Stripe webhook flow mapping. Highlights client payments processing, invoice settlement logic, and checkout payment success notification handlers. Verifies signature using secret keys.";
          } else {
            mockOCR += `Full text content extracted from document. Matches filename ${file.name}.`;
          }
          await createFileDoc(file.name, file.type, file.size, mockOCR, parentId);
        }
      };
      fileInput.click();
      return;
    }

    const siblings = documents.filter((d) => d.parentId === parentId);
    try {
      const newId = await addDocument({
        title: type === "whiteboard" ? "Untitled Whiteboard" : "Untitled Subpage",
        content: type === "whiteboard" ? "Whiteboard Canvas" : "<h1>Untitled Subpage</h1><p>Start writing here...</p>",
        authorId: "user_1",
        spaceId: space.id,
        tags: [],
        status: "draft",
        parentId: parentId,
        order: siblings.length,
        type,
        canvasData: type === "whiteboard" ? JSON.stringify([]) : undefined,
        icon: type === "whiteboard" ? "🎨" : undefined,
      });
      router.push(`/knowledge/space/${space.id}/${newId}?edit=true`);
      toast.success(`${type === "whiteboard" ? "Whiteboard" : "Subpage"} draft created!`);
    } catch (e) {
      toast.error("Failed to create subpage");
    }
  };

  const handleDeletePage = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this page and all versions?");
    if (!confirm) return;

    try {
      await deleteDocument(id);
      toast.success("Document deleted");
      if (activeDocId === id) {
        router.push(`/knowledge/space/${space.id}`);
      }
    } catch (e) {
      toast.error("Failed to delete page");
    }
  };

  const handleArchivePage = async (id: string) => {
    try {
      await archiveDocument(id);
      toast.success("Document moved to archive");
      if (activeDocId === id) {
        router.push(`/knowledge/space/${space.id}`);
      }
    } catch (e) {
      toast.error("Failed to archive page");
    }
  };

  return (
    <div className="w-[230px] border-r border-[var(--border)] bg-[var(--sidebar-bg)] flex flex-col h-full select-none flex-shrink-0">
      {/* Space Header */}
      <div className="p-4 border-b border-[var(--sidebar-border)] flex items-center justify-between">
        <Link
          href="/knowledge"
          className="flex items-center gap-1 text-[11.5px] font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft size={12} /> Knowledge Hub
        </Link>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1 hover:bg-[var(--sidebar-item-hover)] rounded text-[var(--foreground-muted)] cursor-pointer"
          title="Space Settings & Permissions"
        >
          <Settings size={13} />
        </button>
      </div>

      <div className="px-4 py-3 flex items-center gap-2">
        <span className="text-[20px]">{space.icon || "📁"}</span>
        <div className="min-w-0">
          <h3 className="text-[13.5px] font-bold text-[var(--foreground)] truncate leading-tight">{space.name}</h3>
          <p className="text-[10px] text-[var(--foreground-subtle)] truncate">Space Workspace</p>
        </div>
      </div>

      {/* Internal Space Search Button */}
      <div className="px-3 pb-3">
        <button
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 border border-[var(--sidebar-border)] bg-[var(--background)] hover:bg-[var(--sidebar-item-hover)] rounded-lg text-[12px] text-[var(--foreground-subtle)] transition-colors cursor-pointer"
        >
          <Search size={12} />
          <span>Quick search...</span>
        </button>
      </div>

      {/* Pages Section */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[var(--foreground-subtle)]">
          <span>Pages</span>
          <ActionMenu
            trigger={
              <button
                className="p-0.5 hover:bg-[var(--sidebar-item-hover)] rounded text-[var(--foreground-muted)] cursor-pointer"
                title="Create content"
              >
                <Plus size={11} />
              </button>
            }
            actions={[
              {
                label: "New Page",
                icon: FileText,
                onClick: () => handleCreateRootPage("document"),
              },
              {
                label: "New Whiteboard",
                icon: Palette,
                onClick: () => handleCreateRootPage("whiteboard"),
              },
              {
                label: "Upload File",
                icon: Paperclip,
                onClick: () => handleCreateRootPage("file"),
              },
            ]}
          />
        </div>

        {rootDocs.length === 0 ? (
          <div className="py-6 text-center text-[var(--foreground-subtle)]">
            <Book size={20} className="mx-auto mb-1.5 opacity-25" />
            <p className="text-[11px] italic">No pages created yet.</p>
            <button
              onClick={() => handleCreateRootPage("document")}
              className="text-[11px] text-[var(--primary)] hover:underline mt-1 font-semibold"
            >
              Create first page
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {rootDocs.map((doc) => (
              <TreeNode
                key={doc.id}
                doc={doc}
                allDocs={documents}
                activeDocId={activeDocId}
                depth={0}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onSelect={handleSelectPage}
                onAddChild={handleCreateChildPage}
                onDelete={handleDeletePage}
                onArchive={handleArchivePage}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <PermissionsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} space={space} />
    </div>
  );
}
