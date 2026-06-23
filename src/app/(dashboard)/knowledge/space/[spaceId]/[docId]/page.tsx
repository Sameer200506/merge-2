"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Folder,
  FileText,
  Pencil,
  Trash2,
  Archive,
  MessageSquare,
  History,
  Paperclip,
  CheckCircle2,
  Calendar,
  Building2,
  FolderKanban,
  CheckSquare,
  ExternalLink,
  ChevronRight,
  Eye,
  BookOpen,
  ArrowLeft,
  X,
  FileDown,
} from "lucide-react";
import { useKnowledgeStore, logKnowledgeActivity } from "@/stores/knowledge.store";
import { useAuthStore } from "@/stores/auth.store";
import { SpaceSidebar } from "@/components/knowledge/space-sidebar";
import { CommentsSidebar } from "@/components/knowledge/comments-sidebar";
import { VersionHistorySidebar } from "@/components/knowledge/version-history";
import { TipTapEditor } from "@/components/knowledge/tiptap-editor";
import { SearchModal } from "@/components/knowledge/search-modal";
import {
  mockCustomers,
  mockProjects,
  mockTasks,
  mockUsers,
  getUserById,
} from "@/lib/mock-data";
import { getInitials, formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import type { Document, DocumentVersion, ID, DocumentStatus } from "@/types";

export default function DocumentWorkspacePage({
  params,
}: {
  params: Promise<{ spaceId: string; docId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { spaceId, docId } = use(params);
  
  const {
    spaces,
    documents,
    updateDocument,
    templates,
    addComment,
    comments,
  } = useKnowledgeStore();
  const { user: currentUser } = useAuthStore();

  const space = spaces.find((s) => s.id === spaceId);
  const docObj = documents.find((d) => d.id === docId);

  // Edit / View state
  const [isEditing, setIsEditing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Edit Form Fields
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editStatus, setEditStatus] = useState<DocumentStatus>("draft");
  const [editParentId, setEditParentId] = useState<string>("");
  const [editCustomerId, setEditCustomerId] = useState<string>("");
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [editTaskId, setEditTaskId] = useState<string>("");
  const [changeSummary, setChangeSummary] = useState("");

  // Sidebar controls
  const [rightSidebar, setRightSidebar] = useState<"comments" | "history" | null>(null);
  
  // Historical Preview
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);

  // Mock Attachments
  const [attachments, setAttachments] = useState<
    { id: string; name: string; url: string; size: string; mimeType: string }[]
  >([
    { id: "att_1", name: "architecture_specs.pdf", url: "#", size: "1.4 MB", mimeType: "application/pdf" },
    { id: "att_2", name: "wireframe_snapshot.png", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=mock", size: "480 KB", mimeType: "image/png" },
  ]);
  const [uploading, setUploading] = useState(false);

  // Initialize fields on doc load or edit mode toggle
  useEffect(() => {
    if (docObj) {
      setEditTitle(docObj.title);
      setEditContent(docObj.content);
      setEditTags(docObj.tags.join(", "));
      setEditStatus(docObj.status);
      setEditParentId(docObj.parentId || "");
      setEditCustomerId(docObj.customerId || "");
      setEditProjectId(docObj.projectId || "");
      setEditTaskId(docObj.taskId || "");
      setChangeSummary("");
    }
  }, [docObj, isEditing]);

  // Read edit parameter from URL query on mount
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [searchParams]);

  if (!space || !docObj) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--foreground-muted)] animate-fade-in">
        <FileText size={48} className="text-[var(--danger)] opacity-30 mb-4" />
        <p className="font-semibold text-[15px] text-[var(--foreground)]">Document Not Found</p>
        <p className="text-[12px] mt-1">The document you are trying to view does not exist or has been deleted.</p>
        <Link href={`/knowledge/space/${spaceId}`} className="mt-4 text-[var(--primary)] text-[12.5px] hover:underline font-semibold">
          Back to Space Dashboard
        </Link>
      </div>
    );
  }

  // Author details
  const author = getUserById(docObj.authorId);
  const editor = getUserById(docObj.updatedBy);

  // Linked items
  const linkedCustomer = mockCustomers.find((c) => c.id === docObj.customerId);
  const linkedProject = mockProjects.find((p) => p.id === docObj.projectId);
  const linkedTask = mockTasks.find((t) => t.id === docObj.taskId);

  // Find document parent path for breadcrumbs
  const getBreadcrumbs = () => {
    const path: Document[] = [];
    let current: Document | undefined = docObj;
    while (current && current.parentId) {
      const parent: Document | undefined = documents.find((d) => d.id === current?.parentId);
      if (parent) {
        path.unshift(parent);
      }
      current = parent;
    }
    return path;
  };

  const breadcrumbs = getBreadcrumbs();

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error("Document title is required");
      return;
    }
    if (!currentUser) return;

    const tagList = editTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const docUpdates: Partial<Document> = {
      status: editStatus,
      parentId: editParentId || null,
      customerId: editCustomerId || undefined,
      projectId: editProjectId || undefined,
      taskId: editTaskId || undefined,
      tags: tagList,
    };

    try {
      await updateDocument(
        docObj.id,
        editTitle,
        editContent,
        currentUser.id,
        docUpdates,
        changeSummary.trim() || "Manual save"
      );
      toast.success("Document updated!");
      setIsEditing(false);
      
      // Clean query params
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url.toString());
    } catch (e) {
      toast.error("Failed to save changes");
    }
  };

  // Load Template content directly
  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const confirm = window.confirm("Loading a template will overwrite the editor's current contents. Proceed?");
      if (confirm) {
        setEditTitle(template.titleTemplate.replace("[Procedure Name]", "SOP Name").replace("[Date/Topic]", "Sync notes").replace("[Project Name]", "Wiki").replace("[Customer Name]", "Client").replace("[Topic]", "Handbook"));
        setEditContent(template.contentTemplate);
      }
    }
  };

  // Mock Attachment Upload
  const handleAttachmentUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const newAtt = {
      id: `att_${Math.random().toString(36).substring(2, 9)}`,
      name: "uploaded_attachment_" + Date.now().toString().slice(-4) + ".pdf",
      url: "#",
      size: "240 KB",
      mimeType: "application/pdf",
    };
    setAttachments((prev) => [...prev, newAtt]);
    setUploading(false);
    toast.success("Attachment uploaded successfully!");

    // Log Activity
    if (currentUser) {
      logKnowledgeActivity(
        currentUser.id,
        currentUser.displayName,
        "file_uploaded",
        "contact",
        docObj.id,
        docObj.title,
        `${currentUser.displayName} uploaded attachment "${newAtt.name}" to document "${docObj.title}"`
      );
    }
  };

  const handleSelectTextComment = () => {
    const selection = window.getSelection()?.toString().trim();
    if (!selection) {
      toast.info("Please highlight/select text in the document body first to add an inline comment.");
      return;
    }
    setRightSidebar("comments");
    setTimeout(() => {
      const commentInput = document.querySelector("textarea[placeholder*='inline']");
      if (commentInput) (commentInput as HTMLTextAreaElement).focus();
    }, 200);
    // Alert info
    toast.success("Inline text captured! Add your comment in the panel.");
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height,60px))] -m-6 overflow-hidden bg-[var(--background)] relative">
      {/* Global Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Left Sidebar: Page tree hierarchy */}
      <SpaceSidebar
        space={space}
        documents={documents}
        activeDocId={docObj.id}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Center Pane: Document Viewer / Editor */}
      <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
        
        {/* Navigation / Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--background-subtle)] sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-[11.5px] text-[var(--foreground-muted)] overflow-hidden mr-4">
            <Link href="/knowledge" className="hover:underline flex-shrink-0">Hub</Link>
            <ChevronRight size={10} className="flex-shrink-0" />
            <Link href={`/knowledge/space/${space.id}`} className="hover:underline truncate max-w-[80px]">
              {space.name}
            </Link>
            {breadcrumbs.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
                <ChevronRight size={10} className="flex-shrink-0" />
                <Link href={`/knowledge/space/${space.id}/${b.id}`} className="hover:underline truncate max-w-[80px]">
                  {b.title}
                </Link>
              </span>
            ))}
            <ChevronRight size={10} className="flex-shrink-0" />
            <span className="font-semibold text-[var(--foreground)] truncate max-w-[120px]">{docObj.title}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="sos-btn sos-btn-outline py-1.5 px-3 text-[12px] cursor-pointer"
                >
                  <Pencil size={12} /> Edit Page
                </button>
                <button
                  onClick={() => setRightSidebar(rightSidebar === "comments" ? null : "comments")}
                  className={cn(
                    "sos-btn py-1.5 px-3 text-[12px] cursor-pointer flex items-center gap-1",
                    rightSidebar === "comments"
                      ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-text)] border-[var(--primary)]"
                      : "sos-btn-outline"
                  )}
                >
                  <MessageSquare size={12} /> Comments
                </button>
                <button
                  onClick={() => setRightSidebar(rightSidebar === "history" ? null : "history")}
                  className={cn(
                    "sos-btn py-1.5 px-3 text-[12px] cursor-pointer flex items-center gap-1",
                    rightSidebar === "history"
                      ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-text)] border-[var(--primary)]"
                      : "sos-btn-outline"
                  )}
                >
                  <History size={12} /> History
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    const url = new URL(window.location.href);
                    url.searchParams.delete("edit");
                    window.history.replaceState({}, "", url.toString());
                  }}
                  className="sos-btn sos-btn-ghost py-1.5 px-3 text-[12px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="sos-btn sos-btn-primary py-1.5 px-3 text-[12px] font-semibold"
                >
                  Save Page
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Mode Workspace */}
        {!isEditing ? (
          <div className="p-8 max-w-3xl mx-auto w-full flex-1 space-y-6">
            
            {/* Historical Preview banner */}
            {previewVersion && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center justify-between text-[12px] text-amber-800 dark:text-amber-300">
                <p className="flex items-center gap-1.5 font-medium">
                  <Eye size={14} /> Previewing revision #{previewVersion.versionNumber} (Saved {formatRelativeTime(previewVersion.timestamp)})
                </p>
                <button
                  onClick={() => setPreviewVersion(null)}
                  className="sos-btn bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-[11px] py-1 px-2.5 rounded font-bold cursor-pointer"
                >
                  Exit Preview
                </button>
              </div>
            )}

            {/* Title / Meta */}
            <div className="space-y-3 pb-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full select-none capitalize border",
                  (previewVersion?.title ? docObj.status : docObj.status) === "published"
                    ? "bg-green-50 text-[var(--success-foreground)] border-green-200 dark:bg-green-950/20"
                    : "bg-amber-50 text-[var(--warning-foreground)] border-amber-200 dark:bg-amber-950/20"
                )}>
                  {previewVersion ? "Viewing Revision" : docObj.status}
                </span>

                {/* Highlight/Comment button */}
                <button
                  onClick={handleSelectTextComment}
                  className="text-[10.5px] font-medium text-[var(--foreground-muted)] hover:text-[var(--primary)] border border-[var(--border)] px-2 py-0.5 rounded bg-[var(--background-subtle)] transition-colors cursor-pointer"
                  title="Highlight text to review"
                >
                  💬 Comment on selection
                </button>
              </div>

              <h1 className="text-[28px] font-extrabold text-[var(--foreground)] tracking-tight leading-tight">
                {previewVersion ? previewVersion.title : docObj.title}
              </h1>

              {/* Author, Editor, Timestamps */}
              <div className="flex items-center gap-4 text-[11.5px] text-[var(--foreground-subtle)] flex-wrap pt-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[7.5px] font-bold text-white">
                    {author ? getInitials(author.displayName) : "?"}
                  </div>
                  <span>
                    Written by <strong>{author?.displayName || "Unknown"}</strong>
                  </span>
                </div>
                {editor && (
                  <>
                    <span className="opacity-40">•</span>
                    <span>
                      Last edited by <strong>{editor.displayName}</strong> on {formatDate(previewVersion ? previewVersion.timestamp : docObj.updatedAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Tags */}
              {docObj.tags.length > 0 && (
                <div className="flex items-center gap-1.5 pt-2 flex-wrap">
                  {docObj.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-[var(--background-subtle)] border border-[var(--border)] rounded-md text-[var(--foreground-muted)] font-medium font-mono"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Document Content Render */}
            <div
              className="prose prose-slate dark:prose-invert max-w-none text-[14px] leading-relaxed select-text"
              dangerouslySetInnerHTML={{
                __html: previewVersion ? previewVersion.content : docObj.content,
              }}
            />

            {/* Linked Entities (CRM, Projects, Tasks) */}
            {(linkedCustomer || linkedProject || linkedTask) && (
              <div className="pt-6 border-t border-[var(--border)] space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                  Linked Integrations
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {linkedCustomer && (
                    <Link
                      href={`/customers/${linkedCustomer.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] hover:bg-slate-100 hover:border-[var(--primary)] text-[12px] text-[var(--primary)] transition-all font-semibold"
                    >
                      <Building2 size={12} />
                      <span>CRM: {linkedCustomer.name}</span>
                      <ExternalLink size={9} />
                    </Link>
                  )}
                  {linkedProject && (
                    <Link
                      href={`/projects/${linkedProject.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] hover:bg-slate-100 hover:border-[var(--primary)] text-[12px] text-[var(--primary)] transition-all font-semibold"
                    >
                      <FolderKanban size={12} />
                      <span>Project: {linkedProject.name}</span>
                      <ExternalLink size={9} />
                    </Link>
                  )}
                  {linkedTask && (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] text-[12px] text-[var(--foreground-muted)] font-semibold"
                    >
                      <CheckSquare size={12} />
                      <span>Task: {linkedTask.title}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments panel */}
            <div className="pt-6 border-t border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] flex items-center gap-1">
                  <Paperclip size={11} /> Page Attachments ({attachments.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAttachmentUpload}
                  disabled={uploading}
                  className="text-[11.5px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  {uploading ? "Uploading..." : "+ Upload File"}
                </button>
              </div>

              {attachments.length === 0 ? (
                <p className="text-[11.5px] text-[var(--foreground-subtle)] italic">No files attached.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 border border-[var(--border)] rounded-xl bg-[var(--card)] text-[12px]"
                    >
                      <div className="flex items-center gap-2 min-w-0 mr-4">
                        <FileText size={13} className="text-[var(--primary)] flex-shrink-0" />
                        <span className="font-semibold text-[var(--foreground)] truncate" title={att.name}>
                          {att.name}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-subtle)] flex-shrink-0">
                          ({att.size})
                        </span>
                      </div>
                      <a
                        href={att.url}
                        className="text-[var(--primary)] hover:underline font-bold text-[11px] flex items-center gap-0.5 flex-shrink-0 cursor-pointer"
                      >
                        <FileDown size={11} /> Get
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* Editor Mode Workspace */
          <form onSubmit={handleSave} className="flex-1 flex overflow-hidden">
            {/* Left Main Editor Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Load template quick toolbar */}
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] flex-wrap">
                <span className="text-[11.5px] font-semibold text-[var(--foreground-muted)]">Apply Template:</span>
                {templates.map((temp) => (
                  <button
                    key={temp.id}
                    type="button"
                    onClick={() => handleLoadTemplate(temp.id)}
                    className="text-[11px] font-medium text-[var(--primary)] border border-indigo-150 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer dark:bg-indigo-950/20"
                  >
                    {temp.icon} {temp.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Title input */}
              <div>
                <input
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Document Title"
                  className="w-full bg-transparent border-b border-transparent focus:border-[var(--border-strong)] text-[22px] font-extrabold text-[var(--foreground)] py-1.5 focus:outline-none placeholder-[var(--foreground-subtle)]"
                />
              </div>

              {/* TipTap Rich Editor */}
              <div className="flex-1">
                <TipTapEditor content={editContent} onChange={setEditContent} />
              </div>

              {/* Revision summary */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--foreground-muted)] mb-1">
                  What did you change? (Revision log summary)
                </label>
                <input
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Added section regarding OAuth2 token refresh flow"
                  className="sos-input text-[12.5px]"
                />
              </div>
            </div>

            {/* Right Meta Settings panel */}
            <div className="w-[240px] border-l border-[var(--border)] bg-[var(--background-subtle)] p-4 overflow-y-auto space-y-4 text-[12.5px] flex-shrink-0 select-none">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Document Settings
              </h3>

              {/* Document Status */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as DocumentStatus)}
                  className="sos-input text-[12.5px] py-1"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Restructure Parent Page */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Parent Page</label>
                <select
                  value={editParentId}
                  onChange={(e) => setEditParentId(e.target.value)}
                  className="sos-input text-[12.5px] py-1"
                >
                  <option value="">No Parent (Root level)</option>
                  {documents
                    .filter((d) => d.spaceId === space.id && d.id !== docObj.id && d.status !== "archived")
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tags input */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Tags</label>
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="e.g. guide, api, auth"
                  className="sos-input text-[12.5px] py-1"
                />
                <span className="text-[10px] text-[var(--foreground-subtle)] mt-1 block">Separate with commas</span>
              </div>

              <hr className="border-[var(--border)] my-2" />

              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
                Entity Integrations
              </h3>

              {/* CRM Customer */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">CRM Customer</label>
                <select
                  value={editCustomerId}
                  onChange={(e) => setEditCustomerId(e.target.value)}
                  className="sos-input text-[12.5px] py-1"
                >
                  <option value="">No linked customer</option>
                  {mockCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Projects */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Project</label>
                <select
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                  className="sos-input text-[12.5px] py-1"
                >
                  <option value="">No linked project</option>
                  {mockProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tasks */}
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Task</label>
                <select
                  value={editTaskId}
                  onChange={(e) => setEditTaskId(e.target.value)}
                  className="sos-input text-[12.5px] py-1"
                >
                  <option value="">No linked task</option>
                  {mockTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </form>
        )}
      </div>

      {/* Slide-over Sidebars (Comments / Versions Timeline) */}
      {!isEditing && rightSidebar === "comments" && (
        <CommentsSidebar documentId={docObj.id} onClose={() => setRightSidebar(null)} />
      )}
      {!isEditing && rightSidebar === "history" && (
        <VersionHistorySidebar
          documentId={docObj.id}
          onClose={() => setRightSidebar(null)}
          onSelectPreviewVersion={setPreviewVersion}
          selectedPreviewVersion={previewVersion}
        />
      )}
    </div>
  );
}
