"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Space,
  Document,
  DocumentVersion,
  DocumentComment,
  DocumentTemplate,
  SpaceRole,
  SpacePermission,
  DocumentStatus,
  ID,
} from "@/types";
import { isFirebaseConfigured, db } from "@/lib/firebase";
import { collection, doc, setDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { mockActivities, mockUsers } from "@/lib/mock-data";

// ── Helper to Log Activity Events ────────────────────────────
export async function logKnowledgeActivity(
  userId: ID,
  userName: string,
  type: "created" | "updated" | "commented" | "file_uploaded",
  entityType: "customer" | "project" | "task" | "contact",
  entityId: ID,
  entityName: string,
  comment?: string,
  metadata?: Record<string, unknown>
) {
  const newActivity = {
    id: `act_${Math.random().toString(36).substring(2, 11)}`,
    organizationId: "org_1",
    type,
    entityType,
    entityId,
    entityName,
    userId,
    comment: comment || `${userName} ${type} ${entityName}`,
    metadata: metadata || {},
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockActivities.unshift(newActivity as any);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(collection(db, "activities"));
      await setDoc(docRef, { ...newActivity, id: docRef.id });
    } catch (e) {
      console.error("Firestore activity logging error:", e);
    }
  }
}

// ── Initial Mock Data ────────────────────────────────────────
const INITIAL_SPACES: Space[] = [
  {
    id: "space_eng",
    organizationId: "org_1",
    name: "Engineering",
    description: "Technical architecture, API documentation, and deployment guides.",
    icon: "💻",
    isArchived: false,
    permissions: [
      { userId: "user_3", role: "admin" }, // James Park is Admin
      { userId: "user_4", role: "editor" }, // Priya is Editor
      { userId: "user_5", role: "editor" },
    ],
    defaultRole: "viewer",
    createdBy: "user_3",
    updatedBy: "user_3",
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "space_sales",
    organizationId: "org_1",
    name: "Sales",
    description: "Sales playbooks, templates, outreach guidelines, and pitches.",
    icon: "💰",
    isArchived: false,
    permissions: [
      { userId: "user_2", role: "admin" }, // Sarah Chen is Admin
    ],
    defaultRole: "editor",
    createdBy: "user_2",
    updatedBy: "user_2",
    createdAt: "2026-02-15T09:00:00Z",
    updatedAt: "2026-02-15T09:00:00Z",
  },
  {
    id: "space_hr",
    organizationId: "org_1",
    name: "HR & Operations",
    description: "Employee Handbooks, SOPs, onboarding guidelines, and culture decks.",
    icon: "🌱",
    isArchived: false,
    permissions: [],
    defaultRole: "viewer",
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: "2026-01-01T08:00:00Z",
    updatedAt: "2026-01-01T08:00:00Z",
  },
];

const INITIAL_TEMPLATES: DocumentTemplate[] = [
  {
    id: "temp_sop",
    organizationId: "org_1",
    name: "SOP (Standard Operating Procedure)",
    description: "Step-by-step instructions for routine operations.",
    category: "sop",
    titleTemplate: "SOP: [Procedure Name]",
    icon: "📋",
    contentTemplate: `<h1>Standard Operating Procedure</h1>
<p><strong>Department:</strong> [Operations/Engineering/Sales]</p>
<p><strong>Purpose:</strong> Describe the goal of this procedure.</p>
<p><strong>Scope:</strong> Who does this apply to?</p>
<hr />
<h3>Steps to Execute:</h3>
<ol>
  <li><strong>Prerequisites:</strong> Describe what is needed before starting.</li>
  <li><strong>Step 1:</strong> Action description.</li>
  <li><strong>Step 2:</strong> Action description.</li>
</ol>
<p class="callout warning"><strong>Caution:</strong> Detail any potential failure points or critical warnings here.</p>`,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "temp_meeting",
    organizationId: "org_1",
    name: "Meeting Notes",
    description: "Record attendees, discussions, and task checklists.",
    category: "meeting",
    titleTemplate: "Meeting: [Date] [Topic Name]",
    icon: "📝",
    contentTemplate: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> [Date]</p>
<p><strong>Attendees:</strong> [Name 1], [Name 2]</p>
<hr />
<h3>Agenda:</h3>
<ul>
  <li>Agenda Item 1</li>
  <li>Agenda Item 2</li>
</ul>
<h3>Discussion Notes:</h3>
<p>Summarize key speaking points, brainstorming, and decisions here.</p>
<h3>Action Items Checklist:</h3>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">Item 1 (Assignee)</li>
  <li data-type="taskItem" data-checked="false">Item 2 (Assignee)</li>
</ul>`,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "temp_project",
    organizationId: "org_1",
    name: "Project Documentation",
    description: "Create project wikis, technical definitions, and status pages.",
    category: "project",
    titleTemplate: "Project Wiki: [Project Name]",
    icon: "🏗️",
    contentTemplate: `<h1>Project Documentation</h1>
<p><strong>Project Overview:</strong> Describe what this project is and its target outcome.</p>
<hr />
<h3>Architectural Overview:</h3>
<p>Summarize database models, frontend structure, and external APIs here.</p>
<h3>Milestones & Roadmap:</h3>
<ul>
  <li><strong>M1 - Discovery & Planning:</strong> Completed</li>
  <li><strong>M2 - MVP Development:</strong> In Progress</li>
  <li><strong>M3 - Release & Staging:</strong> Planned</li>
</ul>`,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "temp_handbook",
    organizationId: "org_1",
    name: "Employee Handbook",
    description: "Welcome materials, remote guidelines, and core values.",
    category: "hr",
    titleTemplate: "Handbook: [Topic]",
    icon: "📘",
    contentTemplate: `<h1>Employee Handbook Section</h1>
<h3>Company Mission:</h3>
<p>Write your mission statement here.</p>
<h3>Working Hours & Policies:</h3>
<ul>
  <li><strong>Flexible hours:</strong> Core collaboration hours are 10 AM to 4 PM.</li>
  <li><strong>Remote-first:</strong> Work from anywhere with a stable internet connection.</li>
</ul>
<h3>Benefits & Off-Time:</h3>
<p>Detail leaves, vacations, and health setups.</p>`,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "temp_onboarding",
    organizationId: "org_1",
    name: "Customer Onboarding Guide",
    description: "Customer onboarding flows, requirements, and contracts.",
    category: "customer",
    titleTemplate: "Onboarding: [Customer Name]",
    icon: "🤝",
    contentTemplate: `<h1>Customer Onboarding Guide</h1>
<p><strong>Customer:</strong> [Customer Name]</p>
<hr />
<h3>Onboarding Checklist:</h3>
<ul class="task-list">
  <li data-type="taskItem" data-checked="false">Send initial agreement / contract</li>
  <li data-type="taskItem" data-checked="false">Setup shared Slack/Teams channel</li>
  <li data-type="taskItem" data-checked="false">Schedule kickoff meeting</li>
</ul>
<h3>Key Stakeholders:</h3>
<p>Name and contact information of key champions.</p>`,
    createdBy: "system",
    updatedBy: "system",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const INITIAL_DOCUMENTS: Document[] = [
  {
    id: "doc_auth",
    organizationId: "org_1",
    title: "Backend API Authentication Guide",
    content: `<h1>Backend API Authentication</h1>
<p>All core endpoints are protected by JWT tokens. Ensure you pass the token in the <code>Authorization</code> header.</p>
<pre><code>const response = await fetch('/api/v1/projects', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});</code></pre>
<p class="callout info">Tokens expire after 24 hours. Code clients must request a fresh token using refresh endpoints.</p>`,
    authorId: "user_3",
    spaceId: "space_eng",
    tags: ["backend", "auth", "security"],
    status: "published",
    parentId: null,
    order: 0,
    createdBy: "user_3",
    updatedBy: "user_3",
    createdAt: "2026-02-01T12:00:00Z",
    updatedAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "doc_oauth",
    organizationId: "org_1",
    title: "OAuth2 Provider Details",
    content: `<h1>OAuth2 Provider Integration</h1>
<p>We act as an OAuth2 provider for customer integrations. The core endpoints are:</p>
<ul>
  <li><strong>Authorize:</strong> <code>/oauth/authorize</code></li>
  <li><strong>Token:</strong> <code>/oauth/token</code></li>
</ul>`,
    authorId: "user_3",
    spaceId: "space_eng",
    tags: ["oauth", "integration"],
    status: "published",
    parentId: "doc_auth", // Nested page!
    order: 0,
    createdBy: "user_3",
    updatedBy: "user_3",
    createdAt: "2026-02-05T15:00:00Z",
    updatedAt: "2026-02-05T15:00:00Z",
  },
  {
    id: "doc_sales_playbook",
    organizationId: "org_1",
    title: "Enterprise Sales Playbook",
    content: `<h1>Enterprise Sales Playbook</h1>
<p>This document details our sales positioning, target personas, and pricing guidelines.</p>
<h3>Value Proposition:</h3>
<p>StartupOS provides a single, unified workspace that replaces Slack, Jira, HubSpot, and Docmost, saving 40% in monthly license fees.</p>`,
    authorId: "user_2",
    spaceId: "space_sales",
    tags: ["playbook", "enterprise"],
    status: "published",
    parentId: null,
    order: 0,
    createdBy: "user_2",
    updatedBy: "user_2",
    createdAt: "2026-02-18T10:00:00Z",
    updatedAt: "2026-02-18T10:00:00Z",
  },
  {
    id: "doc_handbook",
    organizationId: "org_1",
    title: "Company Welcome Guide & Handbook",
    content: `<h1>Welcome to StartupOS!</h1>
<p>This handbook is your reference guide for team operations, tools, and remote guidelines.</p>
<h3>Values:</h3>
<ul>
  <li>Extreme transparency</li>
  <li>Autonomy with accountability</li>
  <li>Obsession with design and visual excellence</li>
</ul>`,
    authorId: "user_1",
    spaceId: "space_hr",
    tags: ["handbook", "welcome", "hr"],
    status: "published",
    parentId: null,
    order: 0,
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: "2026-01-02T09:00:00Z",
    updatedAt: "2026-01-02T09:00:00Z",
  },
];

const INITIAL_VERSIONS: DocumentVersion[] = [
  {
    id: "ver_1",
    organizationId: "org_1",
    documentId: "doc_auth",
    versionNumber: 1,
    title: "Backend API Authentication",
    content: `<h1>Backend API Authentication</h1><p>All core endpoints are protected by JWT tokens.</p>`,
    editorId: "user_3",
    timestamp: "2026-02-01T12:00:00Z",
    changeSummary: "Initial draft",
    createdBy: "user_3",
    updatedBy: "user_3",
    createdAt: "2026-02-01T12:00:00Z",
    updatedAt: "2026-02-01T12:00:00Z",
  },
  {
    id: "ver_2",
    organizationId: "org_1",
    documentId: "doc_auth",
    versionNumber: 2,
    title: "Backend API Authentication Guide",
    content: `<h1>Backend API Authentication</h1>
<p>All core endpoints are protected by JWT tokens. Ensure you pass the token in the <code>Authorization</code> header.</p>
<pre><code>const response = await fetch('/api/v1/projects', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});</code></pre>
<p class="callout info">Tokens expire after 24 hours. Code clients must request a fresh token using refresh endpoints.</p>`,
    editorId: "user_3",
    timestamp: "2026-02-01T14:30:00Z",
    changeSummary: "Added code example and token expiry callout",
    createdBy: "user_3",
    updatedBy: "user_3",
    createdAt: "2026-02-01T14:30:00Z",
    updatedAt: "2026-02-01T14:30:00Z",
  },
];

const INITIAL_COMMENTS: DocumentComment[] = [
  {
    id: "comm_1",
    organizationId: "org_1",
    documentId: "doc_handbook",
    content: "Looks comprehensive! Do we have a section on vacation requests and approvals?",
    authorId: "user_4", // Priya
    parentId: null,
    isResolved: false,
    createdBy: "user_4",
    updatedBy: "user_4",
    createdAt: "2026-01-05T14:00:00Z",
    updatedAt: "2026-01-05T14:00:00Z",
    isEdited: false,
  },
  {
    id: "comm_2",
    organizationId: "org_1",
    documentId: "doc_handbook",
    content: "Yes, it is covered under operations. We will link it here soon.",
    authorId: "user_1", // Alex
    parentId: "comm_1", // Reply!
    isResolved: false,
    createdBy: "user_1",
    updatedBy: "user_1",
    createdAt: "2026-01-05T15:20:00Z",
    updatedAt: "2026-01-05T15:20:00Z",
    isEdited: false,
  },
];

interface KnowledgeState {
  spaces: Space[];
  documents: Document[];
  versions: DocumentVersion[];
  comments: DocumentComment[];
  templates: DocumentTemplate[];
  
  // Setters (used by firebase listener)
  setSpaces: (spaces: Space[]) => void;
  setDocuments: (docs: Document[]) => void;
  setVersions: (versions: DocumentVersion[]) => void;
  setComments: (comments: DocumentComment[]) => void;
  setTemplates: (templates: DocumentTemplate[]) => void;

  // Space Actions
  addSpace: (name: string, description: string, icon: string, creatorId: ID) => Promise<string>;
  updateSpace: (id: ID, updates: Partial<Omit<Space, "id" | "organizationId" | "createdAt">>) => Promise<void>;
  archiveSpace: (id: ID) => Promise<void>;
  updateSpacePermissions: (id: ID, permissions: SpacePermission[]) => Promise<void>;

  // Document Actions
  addDocument: (docData: Omit<Document, "id" | "organizationId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">) => Promise<string>;
  updateDocument: (id: ID, title: string, content: string, editorId: ID, updates?: Partial<Document>, changeSummary?: string) => Promise<void>;
  deleteDocument: (id: ID) => Promise<void>;
  archiveDocument: (id: ID) => Promise<void>;
  restoreDocument: (id: ID) => Promise<void>;
  rollbackDocument: (id: ID, version: DocumentVersion, editorId: ID) => Promise<void>;

  // Comments Actions
  addComment: (docId: ID, content: string, authorId: ID, parentId: ID | null, inlineText?: string) => Promise<void>;
  resolveComment: (commentId: ID, resolverId: ID) => Promise<void>;

  // Template Actions
  addTemplate: (name: string, description: string, category: string, titleTemplate: string, contentTemplate: string, icon?: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      spaces: INITIAL_SPACES,
      documents: INITIAL_DOCUMENTS,
      versions: INITIAL_VERSIONS,
      comments: INITIAL_COMMENTS,
      templates: INITIAL_TEMPLATES,

      setSpaces: (spaces) => set({ spaces }),
      setDocuments: (documents) => set({ documents }),
      setVersions: (versions) => set({ versions }),
      setComments: (comments) => set({ comments }),
      setTemplates: (templates) => set({ templates }),

      // ── Space CRUD ──────────────────────────────────────────
      addSpace: async (name, description, icon, creatorId) => {
        const creator = mockUsers.find((u) => u.id === creatorId);
        const newSpace: Space = {
          id: `space_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          name,
          description,
          icon,
          isArchived: false,
          permissions: [{ userId: creatorId, role: "admin" }],
          defaultRole: "editor",
          createdBy: creatorId,
          updatedBy: creatorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Optimistic local update
        set((state) => ({ spaces: [...state.spaces, newSpace] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "spaces", newSpace.id), newSpace);
          } catch (e) {
            console.error("Firestore addSpace error:", e);
          }
        }

        logKnowledgeActivity(
          creatorId,
          creator?.displayName ?? "Someone",
          "created",
          "contact",
          newSpace.id,
          newSpace.name,
          `${creator?.displayName ?? "Someone"} created the space "${name}"`
        );

        return newSpace.id;
      },

      updateSpace: async (id, updates) => {
        const space = get().spaces.find((s) => s.id === id);
        if (!space) return;

        const updated = {
          ...space,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === id ? updated : s)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "spaces", id), {
              ...updates,
              updatedAt: updated.updatedAt,
            });
          } catch (e) {
            console.error("Firestore updateSpace error:", e);
          }
        }
      },

      archiveSpace: async (id) => {
        const space = get().spaces.find((s) => s.id === id);
        if (!space) return;

        // Local update
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === id ? { ...s, isArchived: true, updatedAt: new Date().toISOString() } : s)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "spaces", id), {
              isArchived: true,
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Firestore archiveSpace error:", e);
          }
        }
      },

      updateSpacePermissions: async (id, permissions) => {
        const space = get().spaces.find((s) => s.id === id);
        if (!space) return;

        // Local update
        set((state) => ({
          spaces: state.spaces.map((s) => (s.id === id ? { ...s, permissions, updatedAt: new Date().toISOString() } : s)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "spaces", id), {
              permissions,
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Firestore updateSpacePermissions error:", e);
          }
        }
      },

      // ── Document CRUD ───────────────────────────────────────
      addDocument: async (docData) => {
        const author = mockUsers.find((u) => u.id === docData.authorId);
        const newDoc: Document = {
          ...docData,
          id: `doc_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          createdBy: docData.authorId,
          updatedBy: docData.authorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({ documents: [...state.documents, newDoc] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documents", newDoc.id), newDoc);
          } catch (e) {
            console.error("Firestore addDocument error:", e);
          }
        }

        // Initialize Version 1
        const initialVersion: DocumentVersion = {
          id: `ver_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          documentId: newDoc.id,
          versionNumber: 1,
          title: newDoc.title,
          content: newDoc.content,
          editorId: newDoc.authorId,
          timestamp: newDoc.createdAt,
          changeSummary: "Document created",
          createdBy: newDoc.authorId,
          updatedBy: newDoc.authorId,
          createdAt: newDoc.createdAt,
          updatedAt: newDoc.createdAt,
        };

        set((state) => ({ versions: [...state.versions, initialVersion] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documentVersions", initialVersion.id), initialVersion);
          } catch (e) {
            console.error("Firestore create initial version error:", e);
          }
        }

        // Log in activity feed
        const linkedType = newDoc.customerId ? "customer" : newDoc.projectId ? "project" : newDoc.taskId ? "task" : "contact";
        const linkedId = newDoc.customerId || newDoc.projectId || newDoc.taskId || newDoc.spaceId;
        const linkedName = newDoc.title;

        logKnowledgeActivity(
          newDoc.authorId,
          author?.displayName ?? "Someone",
          "created",
          linkedType as any,
          linkedId,
          linkedName,
          `${author?.displayName ?? "Someone"} created the document "${newDoc.title}"`
        );

        return newDoc.id;
      },

      updateDocument: async (id, title, content, editorId, updates = {}, changeSummary) => {
        const docObj = get().documents.find((d) => d.id === id);
        if (!docObj) return;

        const updatedDoc = {
          ...docObj,
          ...updates,
          title,
          content,
          updatedBy: editorId,
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? updatedDoc : d)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "documents", id), {
              ...updates,
              title,
              content,
              updatedBy: editorId,
              updatedAt: updatedDoc.updatedAt,
            });
          } catch (e) {
            console.error("Firestore updateDocument error:", e);
          }
        }

        // Determine version number
        const docVersions = get().versions.filter((v) => v.documentId === id);
        const lastVersionNum = docVersions.length > 0 ? Math.max(...docVersions.map((v) => v.versionNumber)) : 0;
        const nextVersionNum = lastVersionNum + 1;

        // Save a version log
        const newVersion: DocumentVersion = {
          id: `ver_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          documentId: id,
          versionNumber: nextVersionNum,
          title,
          content,
          editorId,
          timestamp: updatedDoc.updatedAt,
          changeSummary: changeSummary || `Revision #${nextVersionNum}`,
          createdBy: editorId,
          updatedBy: editorId,
          createdAt: updatedDoc.updatedAt,
          updatedAt: updatedDoc.updatedAt,
        };

        set((state) => ({ versions: [...state.versions, newVersion] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documentVersions", newVersion.id), newVersion);
          } catch (e) {
            console.error("Firestore saveVersion error:", e);
          }
        }

        // Log in Activity feed
        const editor = mockUsers.find((u) => u.id === editorId);
        const linkedType = updatedDoc.customerId ? "customer" : updatedDoc.projectId ? "project" : updatedDoc.taskId ? "task" : "contact";
        const linkedId = updatedDoc.customerId || updatedDoc.projectId || updatedDoc.taskId || updatedDoc.spaceId;

        logKnowledgeActivity(
          editorId,
          editor?.displayName ?? "Someone",
          "updated",
          linkedType as any,
          linkedId,
          title,
          `${editor?.displayName ?? "Someone"} edited document "${title}"`
        );
      },

      deleteDocument: async (id) => {
        const docObj = get().documents.find((d) => d.id === id);
        if (!docObj) return;

        // Local delete (or mark archived depending on UI, but prompt says "Delete Document" and "Archive/Restore Document" separately, so delete actually removes it)
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await deleteDoc(doc(db, "documents", id));
          } catch (e) {
            console.error("Firestore deleteDocument error:", e);
          }
        }
      },

      archiveDocument: async (id) => {
        const docObj = get().documents.find((d) => d.id === id);
        if (!docObj) return;

        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, status: "archived", updatedAt: new Date().toISOString() } : d)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "documents", id), {
              status: "archived",
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Firestore archiveDocument error:", e);
          }
        }
      },

      restoreDocument: async (id) => {
        const docObj = get().documents.find((d) => d.id === id);
        if (!docObj) return;

        // Restore to draft or published
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? { ...d, status: "draft", updatedAt: new Date().toISOString() } : d)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "documents", id), {
              status: "draft",
              updatedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.error("Firestore restoreDocument error:", e);
          }
        }
      },

      rollbackDocument: async (id, version, editorId) => {
        const docObj = get().documents.find((d) => d.id === id);
        if (!docObj) return;

        const updatedDoc = {
          ...docObj,
          title: version.title,
          content: version.content,
          updatedBy: editorId,
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({
          documents: state.documents.map((d) => (d.id === id ? updatedDoc : d)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "documents", id), {
              title: version.title,
              content: version.content,
              updatedBy: editorId,
              updatedAt: updatedDoc.updatedAt,
            });
          } catch (e) {
            console.error("Firestore rollback update error:", e);
          }
        }

        // Add version timeline entry for rollback event
        const docVersions = get().versions.filter((v) => v.documentId === id);
        const lastVersionNum = docVersions.length > 0 ? Math.max(...docVersions.map((v) => v.versionNumber)) : 0;
        const nextVersionNum = lastVersionNum + 1;

        const rollbackVersion: DocumentVersion = {
          id: `ver_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          documentId: id,
          versionNumber: nextVersionNum,
          title: version.title,
          content: version.content,
          editorId,
          timestamp: updatedDoc.updatedAt,
          changeSummary: `Rolled back to revision #${version.versionNumber}`,
          createdBy: editorId,
          updatedBy: editorId,
          createdAt: updatedDoc.updatedAt,
          updatedAt: updatedDoc.updatedAt,
        };

        set((state) => ({ versions: [...state.versions, rollbackVersion] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documentVersions", rollbackVersion.id), rollbackVersion);
          } catch (e) {
            console.error("Firestore save version error:", e);
          }
        }

        // Activity log
        const editor = mockUsers.find((u) => u.id === editorId);
        logKnowledgeActivity(
          editorId,
          editor?.displayName ?? "Someone",
          "updated",
          "contact",
          id,
          version.title,
          `${editor?.displayName ?? "Someone"} rolled back "${version.title}" to version #${version.versionNumber}`
        );
      },

      // ── Comments Actions ────────────────────────────────────
      addComment: async (docId, content, authorId, parentId, inlineText) => {
        const author = mockUsers.find((u) => u.id === authorId);
        const docObj = get().documents.find((d) => d.id === docId);
        
        const newComment: DocumentComment = {
          id: `comm_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          documentId: docId,
          content,
          authorId,
          parentId,
          isResolved: false,
          inlineText,
          isEdited: false,
          createdBy: authorId,
          updatedBy: authorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({ comments: [...state.comments, newComment] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documentComments", newComment.id), newComment);
          } catch (e) {
            console.error("Firestore addComment error:", e);
          }
        }

        // Activity logging
        if (docObj) {
          logKnowledgeActivity(
            authorId,
            author?.displayName ?? "Someone",
            "commented",
            "contact",
            docId,
            docObj.title,
            `${author?.displayName ?? "Someone"} commented on "${docObj.title}": "${content.substring(0, 50)}${content.length > 50 ? "..." : ""}"`
          );
        }
      },

      resolveComment: async (commentId, resolverId) => {
        const comment = get().comments.find((c) => c.id === commentId);
        if (!comment) return;

        const resolvedUpdates = {
          isResolved: true,
          resolvedBy: resolverId,
          resolvedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({
          comments: state.comments.map((c) => (c.id === commentId ? { ...c, ...resolvedUpdates } : c)),
        }));

        if (isFirebaseConfigured && db) {
          try {
            await updateDoc(doc(db, "documentComments", commentId), resolvedUpdates);
          } catch (e) {
            console.error("Firestore resolveComment error:", e);
          }
        }
      },

      // ── Template CRUD ───────────────────────────────────────
      addTemplate: async (name, description, category, titleTemplate, contentTemplate, icon = "📄") => {
        const newTemplate: DocumentTemplate = {
          id: `temp_${Math.random().toString(36).substring(2, 11)}`,
          organizationId: "org_1",
          name,
          description,
          category: category as any,
          titleTemplate,
          contentTemplate,
          icon,
          createdBy: "user_1",
          updatedBy: "user_1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Local update
        set((state) => ({ templates: [...state.templates, newTemplate] }));

        if (isFirebaseConfigured && db) {
          try {
            await setDoc(doc(db, "documentTemplates", newTemplate.id), newTemplate);
          } catch (e) {
            console.error("Firestore addTemplate error:", e);
          }
        }
      },
    }),
    {
      name: "startupos-knowledge",
      // Only persist local state if firebase is not running, 
      // but in either case, saving to local storage is a good fallback
    }
  )
);
