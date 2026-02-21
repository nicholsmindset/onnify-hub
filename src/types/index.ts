export type Market = "SG" | "ID" | "US";
export type ClientStatus = "Prospect" | "Onboarding" | "Active" | "Churned";
export type PlanTier = "Starter" | "Growth" | "Pro";
export type Industry = "Real Estate" | "F&B" | "Insurance" | "Health" | "Tech" | "SaaS";

export type OnboardingStatusType = "none" | "in_progress" | "complete";

export interface Client {
  id: string;
  clientId: string; // OW-SG-001 (client_id in DB)
  companyName: string;
  market: Market;
  industry: string;
  planTier: PlanTier;
  ghlUrl?: string;
  status: ClientStatus;
  primaryContact: string;
  contractStart?: string;
  contractEnd?: string;
  monthlyValue: number;
  primaryLanguage?: string;
  secondaryLanguage?: string;
  onboardingStatus?: OnboardingStatusType;
  brandVoiceSummary?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ServiceType = "SEO" | "Voice AI" | "CRM" | "Paid Media" | "Content" | "Automation" | "Strategy";
export type Priority = "High" | "Medium" | "Low";
export type DeliverableStatus = "Not Started" | "In Progress" | "Review" | "Delivered" | "Approved";

export interface Deliverable {
  id: string;
  deliverableId: string;
  clientId: string;
  clientName?: string; // from view join
  serviceType: ServiceType;
  name: string;
  description?: string;
  assignedTo: string;
  priority: Priority;
  status: DeliverableStatus;
  dueDate: string;
  deliveryDate?: string;
  fileLink?: string;
  clientApproved: boolean;
  market: Market;
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type Currency = "SGD" | "USD" | "IDR";

export interface Invoice {
  id: string;
  invoiceId: string; // INV-2026-001
  clientId: string;
  clientName?: string; // from view join
  month: string;
  amount: number;
  currency: Currency;
  servicesBilled: string;
  invoiceFileLink?: string;
  status: InvoiceStatus;
  paymentDate?: string;
  market: Market;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = "To Do" | "In Progress" | "Done" | "Blocked";
export type TaskCategory = "Admin" | "Strategy" | "Content" | "Tech" | "Sales" | "Ops";

export interface Task {
  id: string;
  taskId: string;
  name: string;
  clientId?: string;
  clientName?: string; // from view join
  deliverableId?: string;
  deliverableName?: string; // from view join
  assignedTo: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper to convert snake_case DB rows to camelCase types
export function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    companyName: row.company_name as string,
    market: row.market as Market,
    industry: row.industry as string,
    planTier: row.plan_tier as PlanTier,
    ghlUrl: row.ghl_url as string | undefined,
    status: row.status as ClientStatus,
    primaryContact: row.primary_contact as string,
    contractStart: row.contract_start as string | undefined,
    contractEnd: row.contract_end as string | undefined,
    monthlyValue: Number(row.monthly_value),
    primaryLanguage: row.primary_language as string | undefined,
    secondaryLanguage: row.secondary_language as string | undefined,
    onboardingStatus: row.onboarding_status as OnboardingStatusType | undefined,
    brandVoiceSummary: row.brand_voice_summary as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapDeliverable(row: Record<string, unknown>): Deliverable {
  return {
    id: row.id as string,
    deliverableId: row.deliverable_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    serviceType: row.service_type as ServiceType,
    name: row.name as string,
    description: row.description as string | undefined,
    assignedTo: row.assigned_to as string,
    priority: row.priority as Priority,
    status: row.status as DeliverableStatus,
    dueDate: row.due_date as string,
    deliveryDate: row.delivery_date as string | undefined,
    fileLink: row.file_link as string | undefined,
    clientApproved: row.client_approved as boolean,
    market: row.market as Market,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceId: row.invoice_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    month: row.month as string,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    servicesBilled: row.services_billed as string,
    invoiceFileLink: row.invoice_file_link as string | undefined,
    status: row.status as InvoiceStatus,
    paymentDate: row.payment_date as string | undefined,
    market: row.market as Market,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    name: row.name as string,
    clientId: row.client_id as string | undefined,
    clientName: row.client_name as string | undefined,
    deliverableId: row.deliverable_id as string | undefined,
    deliverableName: row.deliverable_name as string | undefined,
    assignedTo: row.assigned_to as string,
    category: row.category as TaskCategory,
    status: row.status as TaskStatus,
    dueDate: row.due_date as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

// Helper to convert camelCase form values to snake_case for DB inserts
export function toClientRow(data: Partial<Client>) {
  const row: Record<string, unknown> = {};
  if (data.companyName !== undefined) row.company_name = data.companyName;
  if (data.market !== undefined) row.market = data.market;
  if (data.industry !== undefined) row.industry = data.industry;
  if (data.planTier !== undefined) row.plan_tier = data.planTier;
  if (data.ghlUrl !== undefined) row.ghl_url = data.ghlUrl || null;
  if (data.status !== undefined) row.status = data.status;
  if (data.primaryContact !== undefined) row.primary_contact = data.primaryContact;
  if (data.contractStart !== undefined) row.contract_start = data.contractStart || null;
  if (data.contractEnd !== undefined) row.contract_end = data.contractEnd || null;
  if (data.monthlyValue !== undefined) row.monthly_value = data.monthlyValue;
  if (data.primaryLanguage !== undefined) row.primary_language = data.primaryLanguage || null;
  if (data.secondaryLanguage !== undefined) row.secondary_language = data.secondaryLanguage || null;
  if (data.onboardingStatus !== undefined) row.onboarding_status = data.onboardingStatus;
  if (data.brandVoiceSummary !== undefined) row.brand_voice_summary = data.brandVoiceSummary || null;
  return row;
}

export function toDeliverableRow(data: Partial<Deliverable>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.serviceType !== undefined) row.service_type = data.serviceType;
  if (data.name !== undefined) row.name = data.name;
  if (data.description !== undefined) row.description = data.description || null;
  if (data.assignedTo !== undefined) row.assigned_to = data.assignedTo;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.status !== undefined) row.status = data.status;
  if (data.dueDate !== undefined) row.due_date = data.dueDate;
  if (data.deliveryDate !== undefined) row.delivery_date = data.deliveryDate || null;
  if (data.fileLink !== undefined) row.file_link = data.fileLink || null;
  if (data.clientApproved !== undefined) row.client_approved = data.clientApproved;
  if (data.market !== undefined) row.market = data.market;
  return row;
}

export function toInvoiceRow(data: Partial<Invoice>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.month !== undefined) row.month = data.month;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.currency !== undefined) row.currency = data.currency;
  if (data.servicesBilled !== undefined) row.services_billed = data.servicesBilled;
  if (data.invoiceFileLink !== undefined) row.invoice_file_link = data.invoiceFileLink || null;
  if (data.status !== undefined) row.status = data.status;
  if (data.paymentDate !== undefined) row.payment_date = data.paymentDate || null;
  if (data.market !== undefined) row.market = data.market;
  return row;
}

export function toTaskRow(data: Partial<Task>) {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.deliverableId !== undefined) row.deliverable_id = data.deliverableId || null;
  if (data.assignedTo !== undefined) row.assigned_to = data.assignedTo;
  if (data.category !== undefined) row.category = data.category;
  if (data.status !== undefined) row.status = data.status;
  if (data.dueDate !== undefined) row.due_date = data.dueDate;
  if (data.notes !== undefined) row.notes = data.notes || null;
  return row;
}

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = "admin" | "member" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  market?: Market;
  createdAt?: string;
  updatedAt?: string;
}

export function mapUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    fullName: row.full_name as string,
    role: row.role as UserRole,
    avatarUrl: row.avatar_url as string | undefined,
    market: row.market as Market | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

// ============================================
// CONTENT PIPELINE TYPES
// ============================================

export type ContentType = "Blog" | "Social Post" | "Email Campaign" | "Video" | "Case Study" | "Newsletter";
export type ContentPlatform = "Website" | "Instagram" | "LinkedIn" | "Facebook" | "YouTube" | "Email" | "TikTok";
export type ContentStatus = "Ideation" | "Draft" | "Review" | "Approved" | "Scheduled" | "Published";
export type ReviewStatus = "none" | "internal_review" | "client_review" | "changes_requested" | "approved" | "rejected";

export interface ContentItem {
  id: string;
  contentId: string;
  clientId?: string;
  clientName?: string;
  title: string;
  contentType: ContentType;
  platform?: ContentPlatform;
  status: ContentStatus;
  assignedTo: string;
  dueDate: string;
  publishDate?: string;
  contentBody?: string;
  fileLink?: string;
  notes?: string;
  market: Market;
  slaDeadline?: string;
  currentVersion?: number;
  revisionCount?: number;
  reviewStatus?: ReviewStatus;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapContentItem(row: Record<string, unknown>): ContentItem {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    clientId: row.client_id as string | undefined,
    clientName: row.client_name as string | undefined,
    title: row.title as string,
    contentType: row.content_type as ContentType,
    platform: row.platform as ContentPlatform | undefined,
    status: row.status as ContentStatus,
    assignedTo: row.assigned_to as string,
    dueDate: row.due_date as string,
    publishDate: row.publish_date as string | undefined,
    contentBody: row.content_body as string | undefined,
    fileLink: row.file_link as string | undefined,
    notes: row.notes as string | undefined,
    market: row.market as Market,
    slaDeadline: row.sla_deadline as string | undefined,
    currentVersion: row.current_version as number | undefined,
    revisionCount: row.revision_count as number | undefined,
    reviewStatus: row.review_status as ReviewStatus | undefined,
    language: row.language as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toContentItemRow(data: Partial<ContentItem>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.title !== undefined) row.title = data.title;
  if (data.contentType !== undefined) row.content_type = data.contentType;
  if (data.platform !== undefined) row.platform = data.platform || null;
  if (data.status !== undefined) row.status = data.status;
  if (data.assignedTo !== undefined) row.assigned_to = data.assignedTo;
  if (data.dueDate !== undefined) row.due_date = data.dueDate;
  if (data.publishDate !== undefined) row.publish_date = data.publishDate || null;
  if (data.contentBody !== undefined) row.content_body = data.contentBody || null;
  if (data.fileLink !== undefined) row.file_link = data.fileLink || null;
  if (data.notes !== undefined) row.notes = data.notes || null;
  if (data.market !== undefined) row.market = data.market;
  if (data.slaDeadline !== undefined) row.sla_deadline = data.slaDeadline || null;
  if (data.currentVersion !== undefined) row.current_version = data.currentVersion;
  if (data.revisionCount !== undefined) row.revision_count = data.revisionCount;
  if (data.reviewStatus !== undefined) row.review_status = data.reviewStatus;
  if (data.language !== undefined) row.language = data.language || null;
  return row;
}

// ============================================
// GHL SYNC TYPES
// ============================================

export type GhlSyncStatus = "connected" | "disconnected" | "syncing" | "error";

export interface GhlConnection {
  id: string;
  clientId: string;
  clientName?: string;
  displayClientId?: string;
  market?: Market;
  apiKey?: string;
  locationId?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
  syncStatus: GhlSyncStatus;
  contactsSynced: number;
  pipelinesSynced: number;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapGhlConnection(row: Record<string, unknown>): GhlConnection {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    displayClientId: row.display_client_id as string | undefined,
    market: row.market as Market | undefined,
    apiKey: row.api_key as string | undefined,
    locationId: row.location_id as string | undefined,
    syncEnabled: row.sync_enabled as boolean,
    lastSyncAt: row.last_sync_at as string | undefined,
    syncStatus: row.sync_status as GhlSyncStatus,
    contactsSynced: Number(row.contacts_synced || 0),
    pipelinesSynced: Number(row.pipelines_synced || 0),
    errorMessage: row.error_message as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toGhlConnectionRow(data: Partial<GhlConnection>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.apiKey !== undefined) row.api_key = data.apiKey || null;
  if (data.locationId !== undefined) row.location_id = data.locationId || null;
  if (data.syncEnabled !== undefined) row.sync_enabled = data.syncEnabled;
  if (data.syncStatus !== undefined) row.sync_status = data.syncStatus;
  return row;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationTrigger = "overdue_deliverable" | "overdue_invoice" | "status_change" | "upcoming_due" | "new_assignment" | "client_onboarding";
export type NotificationChannel = "email" | "in_app" | "both";
export type NotificationType = "info" | "warning" | "error" | "success";

export interface NotificationRule {
  id: string;
  name: string;
  triggerType: NotificationTrigger;
  channel: NotificationChannel;
  recipients: string[];
  isActive: boolean;
  conditions: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export function mapNotificationRule(row: Record<string, unknown>): NotificationRule {
  return {
    id: row.id as string,
    name: row.name as string,
    triggerType: row.trigger_type as NotificationTrigger,
    channel: row.channel as NotificationChannel,
    recipients: row.recipients as string[],
    isActive: row.is_active as boolean,
    conditions: (row.conditions as Record<string, unknown>) || {},
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toNotificationRuleRow(data: Partial<NotificationRule>) {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.triggerType !== undefined) row.trigger_type = data.triggerType;
  if (data.channel !== undefined) row.channel = data.channel;
  if (data.recipients !== undefined) row.recipients = data.recipients;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  if (data.conditions !== undefined) row.conditions = data.conditions;
  return row;
}

export interface Notification {
  id: string;
  userEmail: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt?: string;
}

export function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userEmail: row.user_email as string,
    title: row.title as string,
    message: row.message as string,
    type: row.type as NotificationType,
    isRead: row.is_read as boolean,
    link: row.link as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

// ============================================
// PORTAL ACCESS TYPES
// ============================================

export interface PortalAccess {
  id: string;
  clientId: string;
  accessToken: string;
  contactEmail: string;
  contactName: string;
  isActive: boolean;
  lastAccessedAt?: string;
  createdAt?: string;
}

export function mapPortalAccess(row: Record<string, unknown>): PortalAccess {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    accessToken: row.access_token as string,
    contactEmail: row.contact_email as string,
    contactName: row.contact_name as string,
    isActive: row.is_active as boolean,
    lastAccessedAt: row.last_accessed_at as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export function toPortalAccessRow(data: Partial<PortalAccess>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.accessToken !== undefined) row.access_token = data.accessToken;
  if (data.contactEmail !== undefined) row.contact_email = data.contactEmail;
  if (data.contactName !== undefined) row.contact_name = data.contactName;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

// ============================================
// CLIENT ONBOARDING TYPES (Upgrade 1)
// ============================================

export type OnboardingStep = "intake_pending" | "intake_completed" | "brand_review" | "first_content" | "client_review" | "complete";

export interface ClientOnboarding {
  id: string;
  clientId: string;
  status: OnboardingStep;
  intakeData: Record<string, unknown>;
  brandVoiceDoc?: string;
  onboardingStartedAt?: string;
  onboardingCompletedAt?: string;
  checklist: Array<{ step: string; completed: boolean; completedAt?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export function mapClientOnboarding(row: Record<string, unknown>): ClientOnboarding {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    status: row.status as OnboardingStep,
    intakeData: (row.intake_data as Record<string, unknown>) || {},
    brandVoiceDoc: row.brand_voice_doc as string | undefined,
    onboardingStartedAt: row.onboarding_started_at as string | undefined,
    onboardingCompletedAt: row.onboarding_completed_at as string | undefined,
    checklist: (row.checklist as Array<{ step: string; completed: boolean; completedAt?: string }>) || [],
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toClientOnboardingRow(data: Partial<ClientOnboarding>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.status !== undefined) row.status = data.status;
  if (data.intakeData !== undefined) row.intake_data = data.intakeData;
  if (data.brandVoiceDoc !== undefined) row.brand_voice_doc = data.brandVoiceDoc || null;
  if (data.onboardingStartedAt !== undefined) row.onboarding_started_at = data.onboardingStartedAt;
  if (data.onboardingCompletedAt !== undefined) row.onboarding_completed_at = data.onboardingCompletedAt;
  if (data.checklist !== undefined) row.checklist = data.checklist;
  return row;
}

// ============================================
// CONTENT REVIEW TYPES (Upgrade 2)
// ============================================

export type ReviewAction = "approve" | "request_changes" | "reject";
export type ReviewerType = "internal" | "client";

export interface ContentReview {
  id: string;
  contentId: string;
  reviewerType: ReviewerType;
  reviewerName: string;
  action: ReviewAction;
  comments?: string;
  createdAt?: string;
}

export function mapContentReview(row: Record<string, unknown>): ContentReview {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    reviewerType: row.reviewer_type as ReviewerType,
    reviewerName: row.reviewer_name as string,
    action: row.action as ReviewAction,
    comments: row.comments as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

// ============================================
// CONTENT VERSION TYPES (Upgrade 5)
// ============================================

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  title: string;
  contentBody?: string;
  author: string;
  notes?: string;
  createdAt?: string;
}

export function mapContentVersion(row: Record<string, unknown>): ContentVersion {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    versionNumber: Number(row.version_number),
    title: row.title as string,
    contentBody: row.content_body as string | undefined,
    author: row.author as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

// ============================================
// SLA DEFINITION TYPES (Upgrade 3)
// ============================================

export interface SlaDefinition {
  id: string;
  contentType: string;
  briefToDraftDays: number;
  draftToReviewDays: number;
  reviewToPublishDays: number;
  totalDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export function mapSlaDefinition(row: Record<string, unknown>): SlaDefinition {
  return {
    id: row.id as string,
    contentType: row.content_type as string,
    briefToDraftDays: Number(row.brief_to_draft_days),
    draftToReviewDays: Number(row.draft_to_review_days),
    reviewToPublishDays: Number(row.review_to_publish_days),
    totalDays: Number(row.total_days),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toSlaDefinitionRow(data: Partial<SlaDefinition>) {
  const row: Record<string, unknown> = {};
  if (data.contentType !== undefined) row.content_type = data.contentType;
  if (data.briefToDraftDays !== undefined) row.brief_to_draft_days = data.briefToDraftDays;
  if (data.draftToReviewDays !== undefined) row.draft_to_review_days = data.draftToReviewDays;
  if (data.reviewToPublishDays !== undefined) row.review_to_publish_days = data.reviewToPublishDays;
  if (data.totalDays !== undefined) row.total_days = data.totalDays;
  return row;
}

// ============================================
// RETAINER TYPES (Upgrade 4)
// ============================================

export interface RetainerTier {
  id: string;
  name: string;
  blogsPerMonth: number;
  servicePagesPerMonth: number;
  pseoPagesPerMonth: number;
  socialCascadesPerMonth: number;
  emailSequencesPerMonth: number;
  caseStudiesPerMonth: number;
  revisionsPerPiece: number;
  contentRequestsPerMonth: number;
  createdAt?: string;
  updatedAt?: string;
}

export function mapRetainerTier(row: Record<string, unknown>): RetainerTier {
  return {
    id: row.id as string,
    name: row.name as string,
    blogsPerMonth: Number(row.blogs_per_month || 0),
    servicePagesPerMonth: Number(row.service_pages_per_month || 0),
    pseoPagesPerMonth: Number(row.pseo_pages_per_month || 0),
    socialCascadesPerMonth: Number(row.social_cascades_per_month || 0),
    emailSequencesPerMonth: Number(row.email_sequences_per_month || 0),
    caseStudiesPerMonth: Number(row.case_studies_per_month || 0),
    revisionsPerPiece: Number(row.revisions_per_piece || 1),
    contentRequestsPerMonth: Number(row.content_requests_per_month || 0),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toRetainerTierRow(data: Partial<RetainerTier>) {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.blogsPerMonth !== undefined) row.blogs_per_month = data.blogsPerMonth;
  if (data.servicePagesPerMonth !== undefined) row.service_pages_per_month = data.servicePagesPerMonth;
  if (data.pseoPagesPerMonth !== undefined) row.pseo_pages_per_month = data.pseoPagesPerMonth;
  if (data.socialCascadesPerMonth !== undefined) row.social_cascades_per_month = data.socialCascadesPerMonth;
  if (data.emailSequencesPerMonth !== undefined) row.email_sequences_per_month = data.emailSequencesPerMonth;
  if (data.caseStudiesPerMonth !== undefined) row.case_studies_per_month = data.caseStudiesPerMonth;
  if (data.revisionsPerPiece !== undefined) row.revisions_per_piece = data.revisionsPerPiece;
  if (data.contentRequestsPerMonth !== undefined) row.content_requests_per_month = data.contentRequestsPerMonth;
  return row;
}

export interface RetainerUsage {
  id: string;
  clientId: string;
  month: string;
  blogsUsed: number;
  servicePagesUsed: number;
  pseoPagesUsed: number;
  socialCascadesUsed: number;
  emailSequencesUsed: number;
  caseStudiesUsed: number;
  revisionsUsed: number;
  contentRequestsUsed: number;
  createdAt?: string;
  updatedAt?: string;
}

export function mapRetainerUsage(row: Record<string, unknown>): RetainerUsage {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    month: row.month as string,
    blogsUsed: Number(row.blogs_used || 0),
    servicePagesUsed: Number(row.service_pages_used || 0),
    pseoPagesUsed: Number(row.pseo_pages_used || 0),
    socialCascadesUsed: Number(row.social_cascades_used || 0),
    emailSequencesUsed: Number(row.email_sequences_used || 0),
    caseStudiesUsed: Number(row.case_studies_used || 0),
    revisionsUsed: Number(row.revisions_used || 0),
    contentRequestsUsed: Number(row.content_requests_used || 0),
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toRetainerUsageRow(data: Partial<RetainerUsage>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.month !== undefined) row.month = data.month;
  if (data.blogsUsed !== undefined) row.blogs_used = data.blogsUsed;
  if (data.servicePagesUsed !== undefined) row.service_pages_used = data.servicePagesUsed;
  if (data.pseoPagesUsed !== undefined) row.pseo_pages_used = data.pseoPagesUsed;
  if (data.socialCascadesUsed !== undefined) row.social_cascades_used = data.socialCascadesUsed;
  if (data.emailSequencesUsed !== undefined) row.email_sequences_used = data.emailSequencesUsed;
  if (data.caseStudiesUsed !== undefined) row.case_studies_used = data.caseStudiesUsed;
  if (data.revisionsUsed !== undefined) row.revisions_used = data.revisionsUsed;
  if (data.contentRequestsUsed !== undefined) row.content_requests_used = data.contentRequestsUsed;
  return row;
}

// ============================================
// QUALITY SCORE TYPES (Upgrade 6)
// ============================================

export interface QualityScore {
  id: string;
  contentId: string;
  seoScore: number;
  brandVoiceScore: number;
  uniquenessScore: number;
  humannessScore: number;
  completenessScore: number;
  compositeScore: number;
  scoredBy?: string;
  scoredAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapQualityScore(row: Record<string, unknown>): QualityScore {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    seoScore: Number(row.seo_score || 0),
    brandVoiceScore: Number(row.brand_voice_score || 0),
    uniquenessScore: Number(row.uniqueness_score || 0),
    humannessScore: Number(row.humanness_score || 0),
    completenessScore: Number(row.completeness_score || 0),
    compositeScore: Number(row.composite_score || 0),
    scoredBy: row.scored_by as string | undefined,
    scoredAt: row.scored_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toQualityScoreRow(data: Partial<QualityScore>) {
  const row: Record<string, unknown> = {};
  if (data.contentId !== undefined) row.content_id = data.contentId;
  if (data.seoScore !== undefined) row.seo_score = data.seoScore;
  if (data.brandVoiceScore !== undefined) row.brand_voice_score = data.brandVoiceScore;
  if (data.uniquenessScore !== undefined) row.uniqueness_score = data.uniquenessScore;
  if (data.humannessScore !== undefined) row.humanness_score = data.humannessScore;
  if (data.completenessScore !== undefined) row.completeness_score = data.completenessScore;
  if (data.compositeScore !== undefined) row.composite_score = data.compositeScore;
  if (data.scoredBy !== undefined) row.scored_by = data.scoredBy || null;
  if (data.scoredAt !== undefined) row.scored_at = data.scoredAt;
  return row;
}

// ============================================
// CONTENT REQUEST TYPES (Upgrade 7)
// ============================================

export type RequestPriority = "standard" | "urgent" | "rush";
export type RequestStatus = "pending" | "accepted" | "rejected" | "converted";

export interface ContentRequest {
  id: string;
  requestId: string;
  clientId: string;
  clientName?: string;
  portalAccessId?: string;
  contentType: string;
  topic: string;
  targetKeyword?: string;
  priority: RequestPriority;
  desiredDate?: string;
  referenceUrls?: string;
  referenceNotes?: string;
  status: RequestStatus;
  convertedContentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapContentRequest(row: Record<string, unknown>): ContentRequest {
  return {
    id: row.id as string,
    requestId: row.request_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    portalAccessId: row.portal_access_id as string | undefined,
    contentType: row.content_type as string,
    topic: row.topic as string,
    targetKeyword: row.target_keyword as string | undefined,
    priority: row.priority as RequestPriority,
    desiredDate: row.desired_date as string | undefined,
    referenceUrls: row.reference_urls as string | undefined,
    referenceNotes: row.reference_notes as string | undefined,
    status: row.status as RequestStatus,
    convertedContentId: row.converted_content_id as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toContentRequestRow(data: Partial<ContentRequest>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.portalAccessId !== undefined) row.portal_access_id = data.portalAccessId || null;
  if (data.contentType !== undefined) row.content_type = data.contentType;
  if (data.topic !== undefined) row.topic = data.topic;
  if (data.targetKeyword !== undefined) row.target_keyword = data.targetKeyword || null;
  if (data.priority !== undefined) row.priority = data.priority;
  if (data.desiredDate !== undefined) row.desired_date = data.desiredDate || null;
  if (data.referenceUrls !== undefined) row.reference_urls = data.referenceUrls || null;
  if (data.referenceNotes !== undefined) row.reference_notes = data.referenceNotes || null;
  if (data.status !== undefined) row.status = data.status;
  if (data.convertedContentId !== undefined) row.converted_content_id = data.convertedContentId || null;
  return row;
}

// ============================================
// CLIENT REPORT TYPES (Upgrade 8)
// ============================================

export type ReportStatus = "draft" | "published";

export interface ClientReport {
  id: string;
  reportId: string;
  clientId: string;
  clientName?: string;
  month: string;
  summary?: string;
  contentDelivered: Array<Record<string, unknown>>;
  pipelineStatus: Record<string, unknown>;
  performanceData: Record<string, unknown>;
  recommendations?: string;
  status: ReportStatus;
  createdAt?: string;
  updatedAt?: string;
}

export function mapClientReport(row: Record<string, unknown>): ClientReport {
  return {
    id: row.id as string,
    reportId: row.report_id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    month: row.month as string,
    summary: row.summary as string | undefined,
    contentDelivered: (row.content_delivered as Array<Record<string, unknown>>) || [],
    pipelineStatus: (row.pipeline_status as Record<string, unknown>) || {},
    performanceData: (row.performance_data as Record<string, unknown>) || {},
    recommendations: row.recommendations as string | undefined,
    status: row.status as ReportStatus,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toClientReportRow(data: Partial<ClientReport>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.month !== undefined) row.month = data.month;
  if (data.summary !== undefined) row.summary = data.summary || null;
  if (data.contentDelivered !== undefined) row.content_delivered = data.contentDelivered;
  if (data.pipelineStatus !== undefined) row.pipeline_status = data.pipelineStatus;
  if (data.performanceData !== undefined) row.performance_data = data.performanceData;
  if (data.recommendations !== undefined) row.recommendations = data.recommendations || null;
  if (data.status !== undefined) row.status = data.status;
  return row;
}

// ============================================
// CONTENT PERFORMANCE TYPES (Upgrade 9)
// ============================================

export type PerformanceTier = "high" | "mid" | "low";

export interface ContentPerformance {
  id: string;
  contentId: string;
  impressions: number;
  clicks: number;
  avgPosition?: number;
  performanceTier?: PerformanceTier;
  lastUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapContentPerformance(row: Record<string, unknown>): ContentPerformance {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    avgPosition: row.avg_position != null ? Number(row.avg_position) : undefined,
    performanceTier: row.performance_tier as PerformanceTier | undefined,
    lastUpdatedAt: row.last_updated_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toContentPerformanceRow(data: Partial<ContentPerformance>) {
  const row: Record<string, unknown> = {};
  if (data.contentId !== undefined) row.content_id = data.contentId;
  if (data.impressions !== undefined) row.impressions = data.impressions;
  if (data.clicks !== undefined) row.clicks = data.clicks;
  if (data.avgPosition !== undefined) row.avg_position = data.avgPosition;
  if (data.performanceTier !== undefined) row.performance_tier = data.performanceTier || null;
  if (data.lastUpdatedAt !== undefined) row.last_updated_at = data.lastUpdatedAt;
  return row;
}
