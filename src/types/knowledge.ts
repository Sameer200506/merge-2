import type { BaseEntity, ID } from "./index";

export type SpaceRole = "viewer" | "commenter" | "editor" | "admin";

export interface SpacePermission {
  userId: ID;
  role: SpaceRole;
}

export interface Space extends BaseEntity {
  name: string;
  description?: string;
  icon?: string; // emoji or lucide icon name
  isArchived: boolean;
  permissions: SpacePermission[];
  defaultRole: SpaceRole;
}

export type DocumentStatus = "draft" | "published" | "archived";

export interface Document extends BaseEntity {
  title: string;
  content: string; // HTML content from TipTap
  authorId: ID;
  spaceId: ID;
  tags: string[];
  status: DocumentStatus;
  parentId: ID | null; // For hierarchy
  order: number;
  // Integrations
  customerId?: ID;
  projectId?: ID;
  taskId?: ID;
}

export interface DocumentVersion extends BaseEntity {
  documentId: ID;
  versionNumber: number;
  title: string;
  content: string;
  editorId: ID;
  timestamp: string;
  changeSummary?: string;
}

export interface DocumentComment extends BaseEntity {
  documentId: ID;
  content: string; // Plain text or HTML comment body
  authorId: ID;
  parentId: ID | null; // For threaded comments
  isResolved: boolean;
  resolvedBy?: ID;
  resolvedAt?: string;
  inlineText?: string; // Highlighted text if inline comment
  isEdited: boolean;
}

export interface DocumentAttachment {
  id: ID;
  documentId: ID;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: ID;
  uploadedAt: string;
}

export interface DocumentTemplate extends BaseEntity {
  name: string;
  description: string;
  category: "sop" | "meeting" | "project" | "hr" | "customer" | "general";
  titleTemplate: string;
  contentTemplate: string; // pre-populated TipTap HTML content
  icon?: string;
}
