"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MessageSquare,
  Send,
  Users,
  Target,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Link as LinkIcon,
  ChevronDown,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { useChatStore } from "@/stores/chat.store";
import { useLeadsStore } from "@/stores/leads.store";
import { mockUsers, mockDeals, mockProjects, mockTasks } from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { PingedEntity } from "@/types";

export function ChatDrawer() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isOpen, setIsOpen, activeChannel, setActiveChannel, messages, sendMessage, markChannelAsRead } = useChatStore();
  const { leads } = useLeadsStore();

  const [inputContent, setInputContent] = useState("");
  const [selectedPings, setSelectedPings] = useState<PingedEntity[]>([]);

  // Suggestion typeahead state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ type: "lead" | "project" | "deal" | "task"; id: string; name: string }[]>([]);

  // Quick Ping Entity Selector State
  const [showPingModal, setShowPingModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages or active channel change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChannel, isOpen]);

  // Mark channel as read when drawer is open, channel changes, or new messages arrive
  useEffect(() => {
    if (isOpen) {
      const key = activeChannel.type === "public" ? "public" : `private:${activeChannel.userId}`;
      markChannelAsRead(key);
    }
  }, [isOpen, activeChannel, messages, markChannelAsRead]);

  // Escape key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsOpen]);

  if (!isOpen || !user) return null;

  // Filter messages for active channel
  const filteredMessages = messages.filter((msg) => {
    if (activeChannel.type === "public") {
      return !msg.recipientId;
    } else {
      // Private message: sent between current user and target user
      const targetUserId = activeChannel.userId;
      return (
        (msg.senderId === user.id && msg.recipientId === targetUserId) ||
        (msg.senderId === targetUserId && msg.recipientId === user.id)
      );
    }
  });

  // Compile all pingable entities
  const allEntities = [
    ...leads.map((l) => ({ type: "lead" as const, id: l.id, name: `${l.name} (${l.contactName})` })),
    ...mockProjects.map((p) => ({ type: "project" as const, id: p.id, name: p.name })),
    ...mockDeals.map((d) => ({ type: "deal" as const, id: d.id, name: d.title })),
    ...mockTasks.map((t) => ({ type: "task" as const, id: t.id, name: t.title })),
  ];

  // Handle Input Changes to trigger typeahead
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputContent(val);

    // Detect if user has typed '#' recently
    const hashIndex = val.lastIndexOf("#");
    if (hashIndex !== -1 && hashIndex >= val.length - 15) {
      const query = val.slice(hashIndex + 1);
      setSuggestionQuery(query);
      setShowSuggestions(true);

      // Filter entities based on query
      const filtered = allEntities.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5)); // show top 5 suggestions
    } else {
      setShowSuggestions(false);
    }
  };

  // Select a suggestion
  const selectSuggestion = (entity: typeof suggestions[0]) => {
    const hashIndex = inputContent.lastIndexOf("#");
    const baseText = inputContent.slice(0, hashIndex);
    
    // Add reference tag inside message
    setInputContent(`${baseText}#${entity.type}:${entity.name} `);
    
    // Add to pinged entities
    if (!selectedPings.some((p) => p.id === entity.id)) {
      setSelectedPings([...selectedPings, { type: entity.type, id: entity.id, name: entity.name }]);
    }
    
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Manually add a ping through link modal
  const addManualPing = (entity: typeof allEntities[0]) => {
    setInputContent((prev) => `${prev}#${entity.type}:${entity.name} `);
    if (!selectedPings.some((p) => p.id === entity.id)) {
      setSelectedPings([...selectedPings, { type: entity.type, id: entity.id, name: entity.name }]);
    }
    setShowPingModal(false);
    inputRef.current?.focus();
  };

  // Send message handler
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    // Scan content to find if any pings have been deleted manually in the text input
    const finalPings = selectedPings.filter((ping) =>
      inputContent.includes(`#${ping.type}:${ping.name}`)
    );

    // If typing to a DM, set recipient
    const recipientId = activeChannel.type === "private" ? activeChannel.userId : undefined;

    sendMessage(
      user.id,
      user.displayName,
      inputContent,
      recipientId,
      finalPings.length > 0 ? finalPings : undefined
    );

    setInputContent("");
    setSelectedPings([]);
    setShowSuggestions(false);
  };

  // Entity icon mapper
  const getEntityIcon = (type: string, size = 14) => {
    switch (type) {
      case "lead":
        return <Target size={size} className="text-emerald-500" />;
      case "project":
        return <FolderKanban size={size} className="text-indigo-500" />;
      case "deal":
        return <DollarSign size={size} className="text-purple-500" />;
      case "task":
        return <CheckSquare size={size} className="text-amber-500" />;
      default:
        return null;
    }
  };

  // Entity border & bg classes
  const getEntityCardStyles = (type: string) => {
    switch (type) {
      case "lead":
        return "border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06]";
      case "project":
        return "border-indigo-500/20 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.06]";
      case "deal":
        return "border-purple-500/20 bg-purple-500/[0.02] hover:bg-purple-500/[0.06]";
      case "task":
        return "border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.06]";
      default:
        return "border-[var(--border)] bg-[var(--background-muted)]/20";
    }
  };

  // Redirect to correct dashboard module
  const handleEntityClick = (entity: PingedEntity) => {
    setIsOpen(false);
    switch (entity.type) {
      case "lead":
        router.push("/leads");
        break;
      case "project":
        router.push(`/projects/${entity.id}`);
        break;
      case "deal":
        router.push("/pipeline");
        break;
      case "task":
        router.push("/tasks");
        break;
    }
    toast.info(`Navigated to ${entity.type} details: ${entity.name}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-[720px] z-50",
          "bg-[var(--background)] border-l border-[var(--border)]",
          "flex shadow-2xl animate-slide-in-right overflow-hidden"
        )}
      >
        {/* Left pane: channels & users list */}
        <div className="w-[200px] sm:w-[240px] border-r border-[var(--border)] bg-[var(--background-muted)]/10 flex flex-col">
          {/* Title */}
          <div className="px-4 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[var(--foreground)] flex items-center gap-1.5">
              <MessageSquare size={16} className="text-[var(--primary)]" />
              StartupOS Chat
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {/* Channels group */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] px-2 mb-1.5">
                Channels
              </p>
              <button
                onClick={() => setActiveChannel({ type: "public" })}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all",
                  activeChannel.type === "public"
                    ? "bg-[var(--primary)] text-white font-medium"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)]"
                )}
              >
                <Hash size={14} />
                <span>public-channel</span>
              </button>
            </div>

            {/* Direct Messages group */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)] px-2 mb-1.5 flex items-center gap-1">
                <Users size={10} />
                Direct Messages
              </p>
              <div className="space-y-0.5">
                {mockUsers
                  .filter((u) => u.id !== user.id) // Hide current user
                  .map((u) => {
                    const isActive = activeChannel.type === "private" && activeChannel.userId === u.id;
                    // Mock online/offline: Mike/Sarah online, James/Alex offline
                    const isOnline = u.id === "user_2" || u.id === "user_5" || u.id === "user_1";
                    return (
                      <button
                        key={u.id}
                        onClick={() => setActiveChannel({ type: "private", userId: u.id })}
                        className={cn(
                          "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12.5px] transition-all text-left",
                          isActive
                            ? "bg-[var(--primary)] text-white font-medium"
                            : "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)]"
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center text-[8px] font-bold text-white">
                            {getInitials(u.displayName)}
                          </div>
                          <span
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[var(--background)]",
                              isOnline ? "bg-emerald-500" : "bg-slate-400"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate leading-tight text-[12px]">{u.displayName}</p>
                          <p className={cn("text-[9.5px] truncate font-normal leading-tight", isActive ? "text-indigo-200" : "text-[var(--foreground-subtle)]")}>
                            {u.role.replace("_", " ")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Chat Workspace */}
        <div className="flex-1 flex flex-col h-full bg-[var(--background)]">
          {/* Header */}
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-muted)]/10">
            <div>
              <h3 className="text-[13.5px] font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                {activeChannel.type === "public" ? (
                  <>
                    <Hash size={15} className="text-[var(--foreground-muted)]" />
                    public-channel
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full gradient-primary flex items-center justify-center text-[7px] font-bold text-white">
                      {getInitials(mockUsers.find((u) => u.id === activeChannel.userId)?.displayName ?? "U")}
                    </div>
                    {mockUsers.find((u) => u.id === activeChannel.userId)?.displayName}
                  </>
                )}
              </h3>
              <p className="text-[11px] text-[var(--foreground-subtle)] mt-0.5">
                {activeChannel.type === "public"
                  ? "Global messaging room for all organization members."
                  : `Private conversation with ${mockUsers.find((u) => u.id === activeChannel.userId)?.displayName}`}
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="sos-btn sos-btn-ghost p-1.5" aria-label="Close">
              <X size={15} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <MessageSquare size={36} className="mb-2 text-[var(--foreground-muted)]" />
                <p className="text-[13px] font-medium text-[var(--foreground-muted)]">No messages yet</p>
                <p className="text-[11.5px] text-[var(--foreground-subtle)]">Send a message to start the conversation!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={cn("flex items-start gap-2.5 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "mr-auto")}>
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                      {getInitials(msg.senderName)}
                    </div>

                    <div className="space-y-1">
                      {/* Name & Time */}
                      <div className={cn("flex items-center gap-1.5 text-[11px]", isMe ? "justify-end" : "justify-start")}>
                        <span className="font-semibold text-[var(--foreground-muted)]">{msg.senderName}</span>
                        <span className="font-mono text-[9.5px] text-[var(--foreground-subtle)]">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Bubble content */}
                      <div
                        className={cn(
                          "px-3.5 py-2 rounded-2xl text-[12.5px] shadow-sm leading-relaxed whitespace-pre-wrap break-words",
                          isMe
                            ? "bg-[var(--primary)] text-white rounded-tr-none"
                            : "bg-[var(--background-muted)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-none"
                        )}
                      >
                        {msg.content}
                      </div>

                      {/* Mentions / Pinged Entities cards */}
                      {msg.pingedEntities && msg.pingedEntities.length > 0 && (
                        <div className={cn("flex flex-wrap gap-2 mt-1.5", isMe ? "justify-end" : "justify-start")}>
                          {msg.pingedEntities.map((ping, idx) => (
                            <button
                              key={`${ping.id}-${idx}`}
                              onClick={() => handleEntityClick(ping)}
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11.5px] font-medium transition-all text-left",
                                getEntityCardStyles(ping.type)
                              )}
                            >
                              {getEntityIcon(ping.type)}
                              <span className="text-[var(--foreground)] truncate max-w-[150px]">{ping.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention Suggestions Tooltip Popup */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="mx-5 mb-1 p-1 bg-[var(--card)] border border-[var(--border-strong)] rounded-lg shadow-xl animate-fade-in divide-y divide-[var(--border)] max-h-[160px] overflow-y-auto">
              <p className="text-[9.5px] text-[var(--foreground-subtle)] px-2.5 py-1 font-bold uppercase tracking-wider">
                Typeahead suggestions for #{suggestionQuery}
              </p>
              {suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => selectSuggestion(item)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[12px] hover:bg-[var(--background-muted)] transition-colors"
                >
                  {getEntityIcon(item.type)}
                  <span className="font-semibold text-[var(--foreground)] truncate">{item.name}</span>
                  <span className="ml-auto text-[9.5px] text-[var(--foreground-subtle)] uppercase px-1 rounded bg-[var(--background-muted)]">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Message Input Box */}
          <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] flex flex-col gap-2 bg-[var(--background-muted)]/10">
            {/* Selected pings display */}
            {selectedPings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {selectedPings.map((ping) => (
                  <span
                    key={ping.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--background-muted)] border border-[var(--border)] text-[10.5px] text-[var(--foreground-muted)]"
                  >
                    {getEntityIcon(ping.type, 11)}
                    <span className="truncate max-w-[120px]">{ping.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPings(selectedPings.filter((p) => p.id !== ping.id));
                        setInputContent((prev) => prev.replace(`#${ping.type}:${ping.name} `, ""));
                      }}
                      className="ml-1 text-[var(--foreground-subtle)] hover:text-[var(--danger)]"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Ping Selector Trigger Button */}
              <button
                type="button"
                onClick={() => setShowPingModal(!showPingModal)}
                className={cn(
                  "sos-btn p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)]",
                  "hover:bg-[var(--background-muted)] transition-all flex items-center justify-center flex-shrink-0 cursor-pointer",
                  showPingModal && "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]"
                )}
                title="Ping CRM Entity (Lead, Deal, Project, Task)"
              >
                <LinkIcon size={14} />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputContent}
                  onChange={handleInputChange}
                  placeholder="Type a message... Use # to ping Leads, Deals, Projects or Tasks"
                  className="w-full sos-input py-2 text-[13px] bg-[var(--card)] pr-10 focus:ring-[var(--primary)]"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputContent.trim()}
                className={cn(
                  "sos-btn p-2 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer",
                  inputContent.trim()
                    ? "bg-[var(--primary)] text-white hover:opacity-90 shadow-md shadow-indigo-500/10"
                    : "bg-[var(--background-muted)] border border-[var(--border)] text-[var(--foreground-subtle)] cursor-not-allowed"
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Manual Link Entity Selector Popover/Modal */}
      {showPingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPingModal(false)} />
          <div className="bg-[var(--card)] border border-[var(--border-strong)] rounded-2xl w-full max-w-[420px] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[380px] animate-scale-in">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-muted)]/10">
              <h4 className="text-[13px] font-bold text-[var(--foreground)] flex items-center gap-1.5">
                <LinkIcon size={13} className="text-[var(--primary)]" />
                Select CRM Entity to Ping
              </h4>
              <button onClick={() => setShowPingModal(false)} className="sos-btn sos-btn-ghost p-1 text-[var(--foreground-subtle)]">
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {allEntities.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => addManualPing(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[var(--background-muted)] rounded-lg transition-colors"
                >
                  {getEntityIcon(item.type, 15)}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--foreground)] truncate leading-snug">{item.name}</p>
                    <p className="text-[9.5px] text-[var(--foreground-subtle)] uppercase leading-none mt-0.5">
                      {item.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
