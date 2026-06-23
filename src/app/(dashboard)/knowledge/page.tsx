"use client";

import { useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Folder,
  FileText,
  Clock,
  Settings,
  ChevronRight,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { useAuthStore } from "@/stores/auth.store";
import { SearchModal } from "@/components/knowledge/search-modal";
import { mockUsers } from "@/lib/mock-data";
import { getInitials, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SPACE_ICONS = ["💻", "💰", "🌱", "📣", "⚙️", "📈", "🎨", "🛠️", "📘", "💡", "🧠", "🎯"];

export default function KnowledgeHubLanding() {
  const router = useRouter();
  const { spaces, documents, addSpace, templates, addDocument } = useKnowledgeStore();
  const { user: currentUser } = useAuthStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [newSpaceOpen, setNewSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [spaceIcon, setSpaceIcon] = useState("💻");

  // Template creation dialog state
  const [templateSelectionOpen, setTemplateSelectionOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [targetSpaceId, setTargetSpaceId] = useState("");

  const activeSpaces = spaces.filter((s) => !s.isArchived);

  // Get recently updated documents
  const recentDocs = [...documents]
    .filter((d) => d.status !== "archived")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceName.trim()) {
      toast.error("Space name is required");
      return;
    }
    if (!currentUser) return;

    try {
      const newId = await addSpace(spaceName, spaceDesc, spaceIcon, currentUser.id);
      toast.success(`Space "${spaceName}" created!`);
      setNewSpaceOpen(false);
      setSpaceName("");
      setSpaceDesc("");
      router.push(`/knowledge/space/${newId}`);
    } catch (e) {
      toast.error("Failed to create space");
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTargetSpaceId(activeSpaces[0]?.id || "");
    setTemplateSelectionOpen(true);
  };

  const handleCreateFromTemplate = async () => {
    if (!targetSpaceId) {
      toast.error("Please select a Space");
      return;
    }
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    try {
      const docId = await addDocument({
        title: template.titleTemplate.replace("[Procedure Name]", "New SOP").replace("[Date/Topic]", "Sync").replace("[Project Name]", "Setup").replace("[Customer Name]", "Client").replace("[Topic]", "Culture"),
        content: template.contentTemplate,
        authorId: currentUser?.id || "user_1",
        spaceId: targetSpaceId,
        tags: [template.category],
        status: "draft",
        parentId: null,
        order: documents.filter((d) => d.spaceId === targetSpaceId && d.parentId === null).length,
      });

      toast.success("Document created from template!");
      setTemplateSelectionOpen(false);
      router.push(`/knowledge/space/${targetSpaceId}/${docId}?edit=true`);
    } catch (e) {
      toast.error("Failed to create document from template");
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Hero Header */}
      <div className="page-header relative overflow-hidden p-6 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-indigo-50/50 via-purple-50/20 to-transparent dark:from-indigo-950/15 dark:via-purple-950/5 dark:to-transparent">
        <div className="relative z-10 flex-1 max-w-xl">
          <h1 className="text-[24px] font-bold text-[var(--foreground)] leading-tight flex items-center gap-2">
            <BookOpen size={24} className="text-[var(--primary)]" />
            Knowledge Hub
          </h1>
          <p className="text-[13px] text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
            Create internal wikis, standard operating procedures (SOPs), technical documents, meeting logs, and team handbooks.
          </p>
          
          {/* Quick Search trigger */}
          <div className="mt-4 relative">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3.5 py-2.5 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background-subtle)] text-[13.5px] text-[var(--foreground-subtle)] rounded-xl transition-all text-left shadow-xs cursor-pointer focus:outline-none"
            >
              <Search size={15} className="text-[var(--primary)]" />
              <span>Search documents, spaces, tags, or authors...</span>
              <span className="ml-auto text-[9.5px] font-semibold text-[var(--foreground-subtle)] px-2 py-0.5 rounded bg-[var(--background-muted)] border border-[var(--border)]">
                ⌘K
              </span>
            </button>
          </div>
        </div>
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 opacity-80 select-none pointer-events-none">
          <Zap size={110} className="text-indigo-200/40 dark:text-indigo-900/10 stroke-[1.5]" />
        </div>
      </div>

      {/* Grid: Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Spaces & Templates */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Spaces Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">Knowledge Spaces</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Sub-workspaces organized by department or focus</p>
            </div>
            <button
              onClick={() => setNewSpaceOpen(true)}
              className="sos-btn sos-btn-primary py-1.5 px-3 text-[12px]"
            >
              <Plus size={13} /> Create Space
            </button>
          </div>

          {/* Spaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSpaces.map((space) => {
              const spaceDocs = documents.filter((d) => d.spaceId === space.id && d.status !== "archived");
              return (
                <Link
                  key={space.id}
                  href={`/knowledge/space/${space.id}`}
                  className="sos-card p-5 block hover:shadow-[var(--card-shadow-md)] hover:-translate-y-0.5 transition-all relative group"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-[28px] leading-none mb-2">{space.icon || "📁"}</div>
                    <ChevronRight size={14} className="text-[var(--foreground-subtle)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-all" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--foreground)] leading-tight">{space.name}</h3>
                  <p className="text-[12px] text-[var(--foreground-muted)] mt-1.5 line-clamp-2 leading-snug">
                    {space.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--foreground-subtle)] font-medium">
                    <FileText size={10} />
                    <span>{spaceDocs.length} pages</span>
                    <span className="opacity-30">•</span>
                    <span className="capitalize">{space.defaultRole} access</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Templates Section */}
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">Start from a Template</h2>
              <p className="text-[11.5px] text-[var(--foreground-muted)]">Accelerate formatting using standard prefilled blueprints</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {templates.map((temp) => (
                <button
                  key={temp.id}
                  onClick={() => handleSelectTemplate(temp.id)}
                  className="p-3 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background-subtle)] hover:border-[var(--border-strong)] rounded-xl transition-all text-left flex flex-col items-start gap-1 cursor-pointer group"
                >
                  <span className="text-[20px] mb-1">{temp.icon || "📄"}</span>
                  <span className="text-[12px] font-bold text-[var(--foreground)] leading-tight truncate w-full group-hover:text-[var(--primary)] transition-colors">
                    {temp.name.split(" ")[0]}
                  </span>
                  <span className="text-[9.5px] text-[var(--foreground-subtle)] leading-normal line-clamp-2">
                    {temp.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Recent activity / updates in Knowledge */}
        <div className="space-y-4">
          <div>
            <h2 className="text-[15px] font-bold text-[var(--foreground)] flex items-center gap-1">
              <Clock size={14} className="text-[var(--primary)]" /> Recent Updates
            </h2>
            <p className="text-[11.5px] text-[var(--foreground-muted)]">Recently modified articles across company</p>
          </div>

          <div className="sos-card p-4 space-y-3 bg-[var(--card)]">
            {recentDocs.length === 0 ? (
              <div className="py-12 text-center text-[var(--foreground-subtle)]">
                <FileText size={28} className="mx-auto mb-2 opacity-25" />
                <p className="text-[12.5px] font-medium">No documents created yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {recentDocs.map((doc, idx) => {
                  const space = spaces.find((s) => s.id === doc.spaceId);
                  const author = mockUsers.find((u) => u.id === doc.authorId);
                  return (
                    <Link
                      key={doc.id}
                      href={`/knowledge/space/${doc.spaceId}/${doc.id}`}
                      className={cn(
                        "block py-3 hover:text-[var(--primary)] transition-colors first:pt-0 last:pb-0",
                      )}
                    >
                      <h4 className="text-[13px] font-semibold text-[var(--foreground)] truncate leading-tight hover:text-[var(--primary)] transition-colors">
                        {doc.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--foreground-subtle)]">
                        <span className="font-medium text-[var(--foreground-muted)] bg-[var(--background-muted)] px-1.5 py-0.2 rounded border border-[var(--border)]">
                          {space?.name || "Space"}
                        </span>
                        <span>•</span>
                        <span>{formatDate(doc.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-white">
                          {author ? getInitials(author.displayName) : "?"}
                        </div>
                        <span className="text-[10px] text-[var(--foreground-muted)]">{author?.displayName || "Unknown"}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE SPACE MODAL DRAWER OVERLAY */}
      {newSpaceOpen && (
        <>
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 animate-fade-in" onClick={() => setNewSpaceOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 bg-[var(--background)] border-l border-[var(--border)] flex flex-col shadow-2xl animate-slide-in-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Folder size={16} className="text-[#f59e0b]" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--foreground)]">New Knowledge Space</h2>
                  <p className="text-[11.5px] text-[var(--foreground-subtle)]">Group documentation for a focus area</p>
                </div>
              </div>
              <button onClick={() => setNewSpaceOpen(false)} className="sos-btn sos-btn-ghost p-1.5"><X size={16} /></button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSpace} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Space Name *</label>
                <input
                  required
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  placeholder="e.g. Operations Playbooks"
                  className="sos-input text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Description</label>
                <textarea
                  value={spaceDesc}
                  onChange={(e) => setSpaceDesc(e.target.value)}
                  placeholder="Summarize the core purpose of this space..."
                  rows={3}
                  className="sos-input text-[13px] resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">Space Icon</label>
                <div className="grid grid-cols-6 gap-2 p-3 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)]">
                  {SPACE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSpaceIcon(icon)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center text-[20px] hover:bg-[var(--border)] cursor-pointer transition-colors border",
                        spaceIcon === icon ? "border-[var(--primary)] bg-[var(--card)]" : "border-transparent"
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setNewSpaceOpen(false)}
                  className="sos-btn sos-btn-ghost py-1.5 text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sos-btn sos-btn-primary py-1.5 text-[12px]"
                >
                  Create Space
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* SELECT SPACE FOR TEMPLATE OVERLAY DIALOG */}
      {templateSelectionOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-fade-in" onClick={() => setTemplateSelectionOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] z-50 p-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[var(--primary)]" />
                  <h3 className="text-[14px] font-semibold text-[var(--foreground)]">Select Target Space</h3>
                </div>
                <button onClick={() => setTemplateSelectionOpen(false)} className="sos-btn sos-btn-ghost p-1.5"><X size={15} /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-[12.5px] text-[var(--foreground-muted)] leading-relaxed">
                  Choose which space to initialize your document from the selected template category.
                </p>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--foreground-muted)] mb-1">Target Space</label>
                  <select
                    value={targetSpaceId}
                    onChange={(e) => setTargetSpaceId(e.target.value)}
                    className="sos-input text-[13px]"
                  >
                    {activeSpaces.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon || "📁"} {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => setTemplateSelectionOpen(false)}
                    className="sos-btn sos-btn-ghost py-1.5 text-[12px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFromTemplate}
                    className="sos-btn sos-btn-primary py-1.5 text-[12px] font-semibold"
                  >
                    Generate Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
