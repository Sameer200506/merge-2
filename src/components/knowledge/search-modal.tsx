"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Folder, FileText, Tag, User, ArrowRight } from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { getUserById } from "@/lib/mock-data";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: "document" | "space";
  title: string;
  subtitle: string;
  url: string;
  tags?: string[];
  authorName?: string;
  spaceName: string;
  excerpt?: string;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { spaces, documents } = useKnowledgeStore();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const term = query.toLowerCase().trim();

    // 1. Search Spaces
    const matchedSpaces: SearchResult[] = spaces
      .filter((s) => !s.isArchived && (s.name.toLowerCase().includes(term) || s.description?.toLowerCase().includes(term)))
      .map((s) => ({
        id: s.id,
        type: "space",
        title: `${s.icon || "📁"} ${s.name}`,
        subtitle: s.description || "Knowledge Space",
        url: `/knowledge/space/${s.id}`,
        spaceName: s.name,
      }));

    // 2. Search Documents
    const matchedDocs: SearchResult[] = documents
      .filter((d) => {
        if (d.status === "archived") return false;
        
        const author = getUserById(d.authorId);
        const authorName = author ? author.displayName.toLowerCase() : "";
        const space = spaces.find((s) => s.id === d.spaceId);
        const spaceName = space ? space.name.toLowerCase() : "";
        
        const matchTitle = d.title.toLowerCase().includes(term);
        const matchContent = d.content.toLowerCase().includes(term);
        const matchTags = d.tags.some((t) => t.toLowerCase().includes(term));
        const matchAuthor = authorName.includes(term);
        const matchSpace = spaceName.includes(term);

        return matchTitle || matchContent || matchTags || matchAuthor || matchSpace;
      })
      .map((d) => {
        const space = spaces.find((s) => s.id === d.spaceId);
        const author = getUserById(d.authorId);
        
        // Build plain text snippet/excerpt
        const plainText = d.content.replace(/<[^>]*>/g, " ");
        const index = plainText.toLowerCase().indexOf(term);
        let excerpt = "";
        if (index !== -1) {
          const start = Math.max(0, index - 30);
          const end = Math.min(plainText.length, index + 70);
          excerpt = (start > 0 ? "..." : "") + plainText.substring(start, end).trim() + (end < plainText.length ? "..." : "");
        } else {
          excerpt = plainText.substring(0, 80).trim() + (plainText.length > 80 ? "..." : "");
        }

        return {
          id: d.id,
          type: "document",
          title: d.title,
          subtitle: `in ${space?.name || "Workspace"} · by ${author?.displayName || "Unknown"}`,
          url: `/knowledge/space/${d.spaceId}/${d.id}`,
          tags: d.tags,
          authorName: author?.displayName,
          spaceName: space?.name || "Workspace",
          excerpt,
        };
      });

    setResults([...matchedSpaces, ...matchedDocs]);
  }, [query, spaces, documents]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!open) return null;

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fade-in" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-[600px] z-50 p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[500px] animate-fade-in">
          {/* Header */}
          <div className="flex items-center px-4 py-3 border-b border-[var(--border)] gap-3 bg-[var(--background-subtle)]">
            <Search size={18} className="text-[var(--primary)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, spaces, tags, or authors..."
              className="flex-1 bg-transparent border-0 text-[14px] focus:outline-none text-[var(--foreground)] placeholder-[var(--foreground-subtle)]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="p-1 rounded-full hover:bg-[var(--background-muted)] text-[var(--foreground-muted)]">
                <X size={14} />
              </button>
            )}
            <span className="text-[10px] font-bold text-[var(--foreground-muted)] px-2 py-0.5 rounded bg-[var(--background-muted)] border border-[var(--border)] select-none">
              ESC
            </span>
          </div>

          {/* Results list */}
          <div className="flex-1 overflow-y-auto p-2">
            {!query.trim() ? (
              <div className="py-12 text-center text-[var(--foreground-muted)]">
                <Search size={28} className="mx-auto mb-2 opacity-20 text-[var(--primary)]" />
                <p className="text-[13px] font-medium">Search the StartupOS Knowledge base</p>
                <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">Start typing to see instant results</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-[var(--foreground-muted)]">
                <FileText size={28} className="mx-auto mb-2 opacity-20 text-[var(--danger)]" />
                <p className="text-[13px] font-medium">No results found for &ldquo;{query}&rdquo;</p>
                <p className="text-[11px] text-[var(--foreground-subtle)] mt-1">Try testing other keywords or tags</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {results.map((res) => (
                  <div
                    key={`${res.type}-${res.id}`}
                    onClick={() => handleSelect(res.url)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--background-subtle)] cursor-pointer transition-colors group border border-transparent hover:border-[var(--border)]"
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--background-muted)] flex items-center justify-center flex-shrink-0 text-[var(--foreground-muted)]">
                      {res.type === "space" ? (
                        <Folder size={14} className="text-[#f59e0b]" />
                      ) : (
                        <FileText size={14} className="text-[var(--primary)]" />
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[13.5px] font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                          {res.title}
                        </p>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--background-muted)] text-[var(--foreground-muted)] border border-[var(--border)]">
                          {res.type}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[var(--foreground-muted)] mt-0.5">{res.subtitle}</p>

                      {/* Excerpt */}
                      {res.excerpt && (
                        <p className="text-[12px] text-[var(--foreground-subtle)] bg-[var(--background-subtle)] p-1.5 rounded mt-1.5 italic font-mono truncate border border-[var(--border)]">
                          {res.excerpt}
                        </p>
                      )}

                      {/* Tags */}
                      {res.tags && res.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {res.tags.map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 bg-[var(--background-muted)] border border-[var(--border)] rounded text-[var(--foreground-muted)] font-medium"
                            >
                              <Tag size={8} />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)]">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Algolia branding */}
          <div className="px-4 py-2 bg-[var(--background-muted)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--foreground-muted)] select-none">
            <div className="flex items-center gap-1">
              <span>Use</span>
              <span className="font-bold px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]">↑↓</span>
              <span>to navigate</span>
              <span className="font-bold px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)]">↵</span>
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1 font-medium text-[var(--foreground-subtle)]">
              <span>Search powered by</span>
              <span className="font-semibold text-[#003dff] dark:text-[#2596ff]">Algolia</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
