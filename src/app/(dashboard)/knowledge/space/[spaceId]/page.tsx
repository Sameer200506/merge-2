"use client";

import { use, useState } from "react";
import { Folder, FileText, Plus, Users, Shield, Clock, BookOpen, Settings, ChevronRight } from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { useAuthStore } from "@/stores/auth.store";
import { SpaceSidebar } from "@/components/knowledge/space-sidebar";
import { SearchModal } from "@/components/knowledge/search-modal";
import { mockUsers } from "@/lib/mock-data";
import { getInitials, formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SpaceLandingPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const router = useRouter();
  const { spaceId } = use(params);
  const { spaces, documents, addDocument } = useKnowledgeStore();
  const { user: currentUser } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);

  const space = spaces.find((s) => s.id === spaceId);

  if (!space) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-[var(--foreground-muted)] animate-fade-in">
        <Folder size={48} className="text-[var(--danger)] opacity-30 mb-4" />
        <p className="font-semibold text-[15px] text-[var(--foreground)]">Space Not Found</p>
        <p className="text-[12px] mt-1">The space you are looking for does not exist or has been archived.</p>
        <Link href="/knowledge" className="mt-4 text-[var(--primary)] text-[12.5px] hover:underline font-semibold">
          Back to Knowledge Hub
        </Link>
      </div>
    );
  }

  // Filter documents in this space
  const spaceDocs = documents.filter((d) => d.spaceId === space.id && d.status !== "archived");
  const rootDocs = spaceDocs.filter((d) => d.parentId === null).sort((a, b) => a.order - b.order);
  const recentUpdates = [...spaceDocs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const handleCreateRootPage = async () => {
    try {
      const newId = await addDocument({
        title: "Untitled Page",
        content: "<h1>Untitled Page</h1><p>Start writing here...</p>",
        authorId: currentUser?.id || "user_1",
        spaceId: space.id,
        tags: [],
        status: "draft",
        parentId: null,
        order: rootDocs.length,
      });
      router.push(`/knowledge/space/${space.id}/${newId}?edit=true`);
      toast.success("Document draft created!");
    } catch (e) {
      toast.error("Failed to create document");
    }
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height,60px))] -m-6 overflow-hidden animate-fade-in">
      {/* Search Modal */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Left Space Sidebar Page Tree */}
      <SpaceSidebar
        space={space}
        documents={documents}
        onSearchOpen={() => setSearchOpen(true)}
      />

      {/* Right Content Area: Space Dashboard */}
      <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)] space-y-6">
        
        {/* Breadcrumbs & Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-1 text-[12px] text-[var(--foreground-muted)]">
            <Link href="/knowledge" className="hover:underline">Knowledge Hub</Link>
            <span>/</span>
            <span className="font-semibold text-[var(--foreground)]">{space.name}</span>
          </div>
          
          <button
            onClick={handleCreateRootPage}
            className="sos-btn sos-btn-primary py-1.5 px-3 text-[12.5px]"
          >
            <Plus size={13} /> New Page
          </button>
        </div>

        {/* Space Profile Card */}
        <div className="sos-card p-6 bg-gradient-to-br from-[var(--background-subtle)] to-[var(--background)] border border-[var(--border)] rounded-xl relative overflow-hidden flex items-start gap-4">
          <span className="text-[42px] leading-none select-none">{space.icon || "📁"}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-bold text-[var(--foreground)] leading-tight">{space.name}</h1>
            <p className="text-[13px] text-[var(--foreground-muted)] mt-1.5 leading-relaxed">
              {space.description || "Welcome to the space dashboard. You can create pages, write guides, and set overrides for members."}
            </p>

            <div className="flex items-center gap-4 mt-4 flex-wrap text-[11.5px] text-[var(--foreground-subtle)] font-medium">
              <span className="flex items-center gap-1.5">
                <FileText size={12} /> {spaceDocs.length} Total Pages
              </span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5">
                <Users size={12} /> {space.permissions.length} Overrides
              </span>
              <span className="opacity-30">•</span>
              <span className="flex items-center gap-1.5 capitalize">
                <Shield size={12} /> Default Access: {space.defaultRole}
              </span>
            </div>
          </div>
        </div>

        {/* Overview content grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main List: Root Pages */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-[13.5px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Root Articles</h3>
            
            {rootDocs.length === 0 ? (
              <div className="py-12 border border-dashed border-[var(--border)] rounded-xl text-center text-[var(--foreground-subtle)] bg-[var(--background-subtle)]">
                <BookOpen size={30} className="mx-auto mb-2 opacity-25" />
                <p className="text-[13px] font-medium">No root articles found</p>
                <p className="text-[11px] mt-0.5">Start by creating a root page using the button above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {rootDocs.map((doc) => {
                  const childrenCount = documents.filter((d) => d.parentId === doc.id && d.status !== "archived").length;
                  return (
                    <Link
                      key={doc.id}
                      href={`/knowledge/space/${space.id}/${doc.id}`}
                      className="flex items-center justify-between p-3.5 border border-[var(--border)] rounded-xl bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-xs transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--background-muted)] flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-[var(--primary)] opacity-80" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {doc.title}
                          </p>
                          <p className="text-[11px] text-[var(--foreground-subtle)]">
                            {childrenCount > 0 ? `${childrenCount} nested subpages` : "No subpages"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--foreground-subtle)] opacity-40 group-hover:opacity-100 group-hover:text-[var(--primary)] transition-opacity" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar list: Recent actions inside Space */}
          <div className="space-y-4">
            <h3 className="text-[13.5px] font-bold text-[var(--foreground-muted)] uppercase tracking-wider flex items-center gap-1">
              <Clock size={13} className="text-[var(--primary)]" /> Space Updates
            </h3>
            
            <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)] space-y-3">
              {recentUpdates.length === 0 ? (
                <p className="text-[11px] text-[var(--foreground-subtle)] italic text-center py-6">No recent updates.</p>
              ) : (
                <div className="space-y-3 divide-y divide-[var(--border)]">
                  {recentUpdates.map((doc, idx) => {
                    const author = mockUsers.find((u) => u.id === doc.authorId);
                    return (
                      <Link
                        key={doc.id}
                        href={`/knowledge/space/${space.id}/${doc.id}`}
                        className="block hover:text-[var(--primary)] transition-colors first:pt-0 pt-3"
                      >
                        <h4 className="text-[12.5px] font-semibold text-[var(--foreground)] truncate leading-tight">
                          {doc.title}
                        </h4>
                        <p className="text-[10px] text-[var(--foreground-subtle)] mt-0.5">
                          Updated {formatDate(doc.updatedAt)}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-3.5 h-3.5 rounded-full gradient-primary flex items-center justify-center text-[6.5px] font-bold text-white">
                            {author ? getInitials(author.displayName) : "?"}
                          </div>
                          <span className="text-[9.5px] text-[var(--foreground-muted)]">{author?.displayName || "Unknown"}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
