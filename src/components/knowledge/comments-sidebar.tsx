"use client";

import { useState } from "react";
import { X, MessageSquare, Check, Reply, CornerDownRight, CheckCircle2, UserPlus } from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { useAuthStore } from "@/stores/auth.store";
import { mockUsers } from "@/lib/mock-data";
import { getInitials, formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocumentComment, ID } from "@/types";

interface CommentsSidebarProps {
  documentId: ID;
  onClose: () => void;
}

export function CommentsSidebar({ documentId, onClose }: CommentsSidebarProps) {
  const { comments, addComment, resolveComment } = useKnowledgeStore();
  const { user: currentUser } = useAuthStore();
  
  const [newCommentText, setNewCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<ID | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionInputType, setMentionInputType] = useState<"new" | "reply">("new");

  const docComments = comments.filter((c) => c.documentId === documentId);
  const activeComments = docComments.filter((c) => !c.parentId && c.isResolved === showResolved);

  const getReplies = (parentId: ID) => {
    return docComments.filter((c) => c.parentId === parentId);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    try {
      await addComment(documentId, newCommentText, currentUser.id, null);
      setNewCommentText("");
      toast.success("Comment added!");
    } catch (e) {
      toast.error("Failed to post comment");
    }
  };

  const handlePostReply = async (parentId: ID) => {
    if (!replyText.trim() || !currentUser) return;

    try {
      await addComment(documentId, replyText, currentUser.id, parentId);
      setReplyText("");
      setActiveReplyId(null);
      toast.success("Reply added!");
    } catch (e) {
      toast.error("Failed to post reply");
    }
  };

  const handleResolve = async (commentId: ID) => {
    if (!currentUser) return;
    try {
      await resolveComment(commentId, currentUser.id);
      toast.success("Comment thread resolved");
    } catch (e) {
      toast.error("Failed to resolve comment");
    }
  };

  // Mention functions
  const handleCommentTextChange = (text: string) => {
    setNewCommentText(text);
    const atIndex = text.lastIndexOf("@");
    if (atIndex !== -1 && atIndex >= text.length - 15) {
      const query = text.substring(atIndex + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionInputType("new");
        return;
      }
    }
    setShowMentions(false);
  };

  const handleReplyTextChange = (text: string) => {
    setReplyText(text);
    const atIndex = text.lastIndexOf("@");
    if (atIndex !== -1 && atIndex >= text.length - 15) {
      const query = text.substring(atIndex + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionInputType("reply");
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (username: string) => {
    if (mentionInputType === "new") {
      const atIndex = newCommentText.lastIndexOf("@");
      const base = newCommentText.substring(0, atIndex);
      setNewCommentText(base + `@${username} `);
    } else {
      const atIndex = replyText.lastIndexOf("@");
      const base = replyText.substring(0, atIndex);
      setReplyText(base + `@${username} `);
    }
    setShowMentions(false);
  };

  const filteredMentionUsers = mockUsers.filter((u) =>
    u.displayName.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  return (
    <div className="w-[320px] border-l border-[var(--border)] bg-[var(--card)] flex flex-col h-full z-10 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background-subtle)]">
        <div className="flex items-center gap-2 text-[var(--foreground)] font-semibold text-[13.5px]">
          <MessageSquare size={14} className="text-[var(--primary)]" />
          <span>Comments ({docComments.filter((c) => !c.isResolved).length})</span>
        </div>
        <button onClick={onClose} className="sos-btn sos-btn-ghost p-1"><X size={15} /></button>
      </div>

      {/* Tabs: Active vs Resolved */}
      <div className="flex border-b border-[var(--border)] text-[11.5px] font-medium bg-[var(--background-subtle)]">
        <button
          onClick={() => setShowResolved(false)}
          className={cn(
            "flex-1 py-2 border-b-2 text-center transition-colors cursor-pointer",
            !showResolved
              ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
              : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          )}
        >
          Active Thread
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={cn(
            "flex-1 py-2 border-b-2 text-center transition-colors cursor-pointer",
            showResolved
              ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
              : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          )}
        >
          Resolved Threads ({docComments.filter((c) => c.isResolved).length})
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeComments.length === 0 ? (
          <div className="py-12 text-center text-[var(--foreground-subtle)]">
            <MessageSquare size={26} className="mx-auto mb-2 opacity-25" />
            <p className="text-[12.5px] font-medium">No comments here yet</p>
            <p className="text-[10.5px] mt-0.5">Start a discussion on this document.</p>
          </div>
        ) : (
          activeComments.map((comment) => {
            const author = mockUsers.find((u) => u.id === comment.authorId);
            const replies = getReplies(comment.id);
            return (
              <div key={comment.id} className="space-y-2 border border-[var(--border)] rounded-xl p-3 bg-[var(--card)] hover:shadow-xs transition-shadow">
                {/* Comment Root */}
                <div className="flex items-start gap-2.5">
                  {/* Avatar */}
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {author ? getInitials(author.displayName) : "?"}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[var(--foreground)] truncate">
                        {author?.displayName || "Unknown Team Member"}
                      </span>
                      <span className="text-[9.5px] text-[var(--foreground-subtle)]">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>

                    {/* Inline highlight if present */}
                    {comment.inlineText && (
                      <p className="text-[11px] text-[var(--foreground-muted)] bg-[var(--background-muted)] px-2 py-0.5 rounded border-l-2 border-[var(--primary)] my-1 truncate italic">
                        &ldquo;{comment.inlineText}&rdquo;
                      </p>
                    )}

                    <p className="text-[12.5px] text-[var(--foreground-muted)] leading-relaxed mt-1 whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    {/* Actions */}
                    {!showResolved && (
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--foreground-subtle)] font-medium">
                        <button
                          onClick={() => {
                            setActiveReplyId(comment.id);
                            setReplyText("");
                          }}
                          className="flex items-center gap-0.5 hover:text-[var(--primary)] cursor-pointer"
                        >
                          <Reply size={10} /> Reply
                        </button>
                        <button
                          onClick={() => handleResolve(comment.id)}
                          className="flex items-center gap-0.5 hover:text-[#22c55e] cursor-pointer"
                        >
                          <Check size={10} /> Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies Thread */}
                {replies.length > 0 && (
                  <div className="pl-6 border-t border-[var(--border)] pt-2.5 space-y-2">
                    {replies.map((reply) => {
                      const repAuthor = mockUsers.find((u) => u.id === reply.authorId);
                      return (
                        <div key={reply.id} className="flex items-start gap-2.5">
                          <CornerDownRight size={10} className="text-[var(--foreground-subtle)] mt-1.5 flex-shrink-0" />
                          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--border)] flex items-center justify-center text-[8px] font-bold text-[var(--foreground-muted)] flex-shrink-0">
                            {repAuthor ? getInitials(repAuthor.displayName) : "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-[var(--foreground)] truncate">
                                {repAuthor?.displayName || "Unknown"}
                              </span>
                              <span className="text-[9px] text-[var(--foreground-subtle)]">
                                {formatRelativeTime(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-[11.5px] text-[var(--foreground-muted)] leading-normal mt-0.5 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Reply Input */}
                {activeReplyId === comment.id && (
                  <div className="mt-3 pl-6 border-t border-[var(--border)] pt-3 space-y-2 relative">
                    <textarea
                      value={replyText}
                      onChange={(e) => handleReplyTextChange(e.target.value)}
                      placeholder="Type a reply... Use @ to mention team"
                      rows={2}
                      className="sos-input text-[11.5px] resize-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="sos-btn sos-btn-ghost py-1 px-2.5 text-[10.5px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handlePostReply(comment.id)}
                        disabled={!replyText.trim()}
                        className="sos-btn sos-btn-primary py-1 px-2.5 text-[10.5px]"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mention Box Overlay */}
      {showMentions && filteredMentionUsers.length > 0 && (
        <div className="mx-4 p-1 border border-[var(--border)] rounded-lg bg-[var(--card)] shadow-lg max-h-[120px] overflow-y-auto divide-y divide-[var(--border)] text-[11.5px] z-20">
          <div className="px-2 py-1 text-[9px] font-bold uppercase text-[var(--foreground-subtle)] flex items-center gap-1 select-none">
            <UserPlus size={8} /> Mention Team Member
          </div>
          {filteredMentionUsers.map((u) => (
            <div
              key={u.id}
              onClick={() => insertMention(u.displayName.replace(/\s+/g, ""))}
              className="flex items-center gap-2 p-1.5 hover:bg-[var(--background-subtle)] cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-white flex-shrink-0">
                {getInitials(u.displayName)}
              </div>
              <span className="font-semibold text-[var(--foreground)]">{u.displayName}</span>
              <span className="text-[10px] text-[var(--foreground-subtle)] ml-auto">@{u.displayName.replace(/\s+/g, "")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Main Comment Input */}
      {!showResolved && (
        <form onSubmit={handlePostComment} className="p-3 border-t border-[var(--border)] bg-[var(--background-subtle)] space-y-2">
          <textarea
            value={newCommentText}
            onChange={(e) => handleCommentTextChange(e.target.value)}
            placeholder="Type a comment... Use @ to mention team"
            rows={3}
            className="sos-input text-[12px] resize-none"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="sos-btn sos-btn-primary w-full py-1.5 text-[12px] font-semibold flex items-center justify-center gap-1"
          >
            <MessageSquare size={12} /> Post Comment
          </button>
        </form>
      )}
    </div>
  );
}
