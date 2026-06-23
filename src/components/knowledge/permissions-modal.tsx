"use client";

import { useState } from "react";
import { X, Shield, Plus, Trash2, Users, Settings, Lock } from "lucide-react";
import { useKnowledgeStore } from "@/stores/knowledge.store";
import { mockUsers } from "@/lib/mock-data";
import type { Space, SpaceRole, SpacePermission } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PermissionsModalProps {
  open: boolean;
  onClose: () => void;
  space: Space;
}

const ROLES: { value: SpaceRole; label: string; desc: string }[] = [
  { value: "viewer", label: "Viewer", desc: "Can read documents and download attachments." },
  { value: "commenter", label: "Commenter", desc: "Can read documents and add comments/replies." },
  { value: "editor", label: "Editor", desc: "Can create, edit, draft, and publish documents." },
  { value: "admin", label: "Admin", desc: "Full access to edit space settings and manage roles." },
];

export function PermissionsModal({ open, onClose, space }: PermissionsModalProps) {
  const { updateSpace, updateSpacePermissions } = useKnowledgeStore();
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || "");
  const [defaultRole, setDefaultRole] = useState<SpaceRole>(space.defaultRole);
  const [permissions, setPermissions] = useState<SpacePermission[]>(space.permissions || []);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<SpaceRole>("viewer");
  const [activeTab, setActiveTab] = useState<"general" | "members">("general");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Space name is required");
      return;
    }
    setSaving(true);
    try {
      await updateSpace(space.id, {
        name,
        description,
        defaultRole,
      });
      toast.success("Space settings updated!");
      onClose();
    } catch (e) {
      toast.error("Failed to update space settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPermission = () => {
    if (!selectedUser) {
      toast.error("Please select a team member");
      return;
    }

    if (permissions.some((p) => p.userId === selectedUser)) {
      toast.error("Member already has override permissions");
      return;
    }

    const updatedPermissions = [...permissions, { userId: selectedUser, role: selectedRole }];
    setPermissions(updatedPermissions);
    updateSpacePermissions(space.id, updatedPermissions);
    toast.success("Permission added!");
    setSelectedUser("");
  };

  const handleRemovePermission = (userId: string) => {
    const updated = permissions.filter((p) => p.userId !== userId);
    setPermissions(updated);
    updateSpacePermissions(space.id, updated);
    toast.success("Permission override removed");
  };

  // Filter out users who already have specific permissions or are owners/creators
  const availableUsers = mockUsers.filter(
    (u) => !permissions.some((p) => p.userId === u.id) && u.id !== space.createdBy
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px] z-50 p-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--primary)]" />
              <h2 className="text-[14px] font-semibold text-[var(--foreground)]">Space Access & Settings</h2>
            </div>
            <button onClick={onClose} className="sos-btn sos-btn-ghost p-1.5"><X size={15} /></button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] px-4 bg-[var(--background-subtle)]">
            <button
              onClick={() => setActiveTab("general")}
              className={cn(
                "px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "general"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Settings size={12} className="inline mr-1" /> General Settings
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={cn(
                "px-3 py-2 text-[12.5px] font-medium border-b-2 transition-colors cursor-pointer",
                activeTab === "members"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              )}
            >
              <Users size={12} className="inline mr-1" /> Member Overrides
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "general" ? (
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                    Space Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="sos-input text-[13px]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="sos-input text-[13px] resize-none"
                  />
                </div>

                {/* Default Organization Role */}
                <div>
                  <label className="block text-[12px] font-medium text-[var(--foreground-muted)] mb-1.5">
                    Default Org Member Role <span className="text-[11px] text-[var(--foreground-subtle)] font-normal">(Inherited access)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={defaultRole}
                      onChange={(e) => setDefaultRole(e.target.value as SpaceRole)}
                      className="sos-input pr-8 text-[13px]"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-[var(--foreground-subtle)] mt-1.5 italic">
                    {ROLES.find((r) => r.value === defaultRole)?.desc}
                  </p>
                </div>

                {/* Footer Save */}
                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                  <button type="button" onClick={onClose} className="sos-btn sos-btn-ghost py-1.5 text-[12px]">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="sos-btn sos-btn-primary py-1.5 text-[12px]">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Add new permission override */}
                <div className="p-3 border border-[var(--border)] rounded-xl bg-[var(--background-subtle)] space-y-3">
                  <h4 className="text-[12px] font-semibold text-[var(--foreground)] flex items-center gap-1">
                    <Plus size={11} /> Override Member Role
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="sos-input text-[12.5px] py-1 px-2"
                    >
                      <option value="">Select member...</option>
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} ({u.role.replace("_", " ")})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as SpaceRole)}
                      className="sos-input text-[12.5px] py-1 px-2"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPermission}
                    className="sos-btn sos-btn-primary w-full py-1.5 text-[12px] font-semibold"
                  >
                    Apply Override Role
                  </button>
                </div>

                {/* Overrides List */}
                <div className="space-y-2">
                  <h4 className="text-[12px] font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
                    <Lock size={11} /> Configured Overrides ({permissions.length})
                  </h4>
                  {permissions.length === 0 ? (
                    <p className="text-[11.5px] text-[var(--foreground-subtle)] italic py-3 text-center">
                      No override policies configured for members. All members inherit default role access.
                    </p>
                  ) : (
                    <div className="border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] overflow-hidden">
                      {permissions.map((p) => {
                        const user = mockUsers.find((u) => u.id === p.userId);
                        if (!user) return null;
                        return (
                          <div key={p.userId} className="flex items-center justify-between p-2.5 bg-[var(--card)] hover:bg-[var(--background-subtle)] transition-colors">
                            <div>
                              <p className="text-[12.5px] font-semibold text-[var(--foreground)]">{user.displayName}</p>
                              <p className="text-[11px] text-[var(--foreground-subtle)] capitalize">{user.role.replace("_", " ")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[var(--primary)] border border-indigo-150 capitalize dark:bg-indigo-950/20">
                                {p.role}
                              </span>
                              <button
                                onClick={() => handleRemovePermission(p.userId)}
                                className="text-[var(--danger)] p-1 hover:bg-[var(--background-muted)] rounded cursor-pointer"
                                title="Remove policy"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
