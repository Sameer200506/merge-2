// ============================================================
// StartupOS — Full TypeScript Type Definitions
// ============================================================

export type ID = string;

// ─── Base Entity ────────────────────────────────────────────
export interface BaseEntity {
  id: ID;
  organizationId: ID;
  createdBy: ID;
  updatedBy: ID;
  createdAt: string;
  updatedAt: string;
}

// ─── Organization ───────────────────────────────────────────
export interface Organization {
  id: ID;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  timezone: string;
  currency: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  status: "active" | "suspended" | "trial";
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User & Roles ────────────────────────────────────────────
export type UserRole =
  | "super_owner"
  | "owner"
  | "admin"
  | "sales_manager"
  | "project_manager"
  | "team_member"
  | "client";

export interface User extends BaseEntity {
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  lastSeenAt?: string;
  notificationPreferences: NotificationPreferences;
}

export interface NotificationPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  dealUpdates: boolean;
  mentions: boolean;
  dueDates: boolean;
  comments: boolean;
}

// ─── Customer ───────────────────────────────────────────────
export type CustomerStatus = "lead" | "prospect" | "customer" | "churned";
export type Industry =
  | "technology"
  | "finance"
  | "healthcare"
  | "retail"
  | "manufacturing"
  | "education"
  | "media"
  | "real_estate"
  | "other";

export interface Customer extends BaseEntity {
  name: string;
  website?: string;
  industry?: Industry;
  status: CustomerStatus;
  revenue?: number;
  employeeCount?: number;
  address?: Address;
  tags: string[];
  ownerId: ID;
  avatarUrl?: string;
  logoUrl?: string;
  notes?: string;
}

// ─── Lead ───────────────────────────────────────────────────
export type LeadStatus = "new" | "contacted" | "qualified" | "nurturing" | "unqualified";
export type LeadSource = "web" | "referral" | "cold_outreach" | "linkedin" | "partner" | "other";

export interface Lead extends BaseEntity {
  name: string; // Company Name
  contactName: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  notes?: string;
}


export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// ─── Contact ─────────────────────────────────────────────────
export interface Contact extends BaseEntity {
  customerId: ID;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  avatarUrl?: string;
  isPrimary: boolean;
  linkedInUrl?: string;
  notes?: string;
}

// ─── Pipeline & Deals ────────────────────────────────────────
export interface Pipeline extends BaseEntity {
  name: string;
  description?: string;
  stages: PipelineStage[];
  isDefault: boolean;
  currency: string;
}

export interface PipelineStage {
  id: ID;
  name: string;
  order: number;
  color: string;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export type DealPriority = "low" | "medium" | "high" | "critical";

export interface Deal extends BaseEntity {
  title: string;
  customerId: ID;
  pipelineId: ID;
  stageId: ID;
  value: number;
  currency: string;
  probability: number;
  priority: DealPriority;
  ownerId: ID;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  tags: string[];
  description?: string;
  score?: number;
  followUpAt?: string;
  isWon: boolean;
  isLost: boolean;
  lostReason?: string;
  projectId?: ID; // linked project after won
}

// ─── Project ──────────────────────────────────────────────────
export type ProjectStatus = "planning" | "active" | "review" | "completed" | "on_hold";
export type ProjectPriority = "low" | "medium" | "high" | "critical";

export interface Project extends BaseEntity {
  name: string;
  description?: string;
  customerId?: ID;
  dealId?: ID; // source deal
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerId: ID;
  teamIds: ID[];
  startDate?: string;
  endDate?: string;
  progress: number; // 0-100
  tags: string[];
  templateId?: ID;
  milestones: Milestone[];
  sprints: Sprint[];
}

export interface Milestone {
  id: ID;
  name: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
  taskIds: ID[];
}

export interface Sprint {
  id: ID;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
  status: "planned" | "active" | "completed";
  taskIds: ID[];
}

// ─── Task ─────────────────────────────────────────────────────
export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
export type TaskPriority = "none" | "low" | "medium" | "high" | "urgent";
export type TaskType = "sales" | "project" | "support";

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: ID;
  projectId?: ID;
  customerId?: ID;
  dealId?: ID;
  sprintId?: ID;
  milestoneId?: ID;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  parentTaskId?: ID;
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  dependencies: TaskDependency[];
  attachments: Attachment[];
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  order: number;
}

export interface Subtask {
  id: ID;
  title: string;
  isCompleted: boolean;
  assigneeId?: ID;
}

export interface ChecklistItem {
  id: ID;
  label: string;
  isChecked: boolean;
}

export interface TaskDependency {
  taskId: ID;
  type: "blocks" | "blocked_by" | "relates_to";
}

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endsAt?: string;
}

// ─── Activity ─────────────────────────────────────────────────
export type ActivityType =
  | "created"
  | "updated"
  | "commented"
  | "mentioned"
  | "status_changed"
  | "assigned"
  | "file_uploaded"
  | "deal_won"
  | "project_created"
  | "task_completed";

export interface Activity extends BaseEntity {
  type: ActivityType;
  entityType: "customer" | "deal" | "project" | "task" | "contact";
  entityId: ID;
  entityName: string;
  userId: ID;
  metadata?: Record<string, unknown>;
  comment?: string;
}

// ─── Comment ──────────────────────────────────────────────────
export interface Comment extends BaseEntity {
  entityType: "deal" | "project" | "task" | "customer";
  entityId: ID;
  content: string; // HTML from TipTap
  mentions: ID[]; // user IDs mentioned
  attachments: Attachment[];
  isEdited: boolean;
}

// ─── Attachment ───────────────────────────────────────────────
export interface Attachment {
  id: ID;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: ID;
  uploadedAt: string;
}

// ─── Notification ─────────────────────────────────────────────
export type NotificationType =
  | "task_assigned"
  | "deal_updated"
  | "mention"
  | "due_date"
  | "comment"
  | "project_update"
  | "deal_won";

export interface Notification extends BaseEntity {
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: ID;
  isRead: boolean;
  readAt?: string;
}

// ─── Subscription ─────────────────────────────────────────────
export interface Subscription {
  id: ID;
  organizationId: ID;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  status: "active" | "past_due" | "cancelled" | "trialing";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats: number;
  usedSeats: number;
}

// ─── UI / Store Types ─────────────────────────────────────────
export interface KanbanColumn {
  id: ID;
  title: string;
  color: string;
  items: Deal[] | Task[];
}

export type ViewMode = "kanban" | "list" | "table" | "calendar" | "timeline";
export type ThemeMode = "light" | "dark" | "system";

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardMetrics {
  leadsThisWeek: number;
  leadsChange: number;
  pipelineValue: number;
  pipelineChange: number;
  revenueForecasted: number;
  revenueChange: number;
  activeProjects: number;
  overdueTasks: number;
  teamWorkload: TeamWorkloadItem[];
  recentActivities: Activity[];
  revenueByMonth: RevenueDataPoint[];
}

export interface TeamWorkloadItem {
  userId: ID;
  userName: string;
  avatarUrl?: string;
  assignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface RevenueDataPoint {
  month: string;
  forecast: number;
  actual: number;
}

// ─── Shift Timing ─────────────────────────────────────────────
export interface Shift {
  id: string;
  userId: string;
  startTime: string; // ISO string
  endTime?: string;  // ISO string
  durationSeconds: number;
  isCompleted: boolean;
}
