export type Market = "SG" | "ID" | "US";
export type ClientStatus = "Prospect" | "Onboarding" | "Active" | "Churned";
export type PlanTier = "Starter" | "Growth" | "Pro";
export type Industry = "Real Estate" | "F&B" | "Insurance" | "Health" | "Tech" | "SaaS";

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
  createdAt?: string;
  updatedAt?: string;
  pipelineStage?: string;
  estimatedValue?: number;
  pipelineNotes?: string | null;
  lastContactAt?: string | null;
  tags?: string[];
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
    clientId: row.client_code as string,
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
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
    pipelineStage: row.pipeline_stage as string | undefined,
    estimatedValue: row.estimated_value != null ? Number(row.estimated_value) : undefined,
    pipelineNotes: (row.pipeline_notes as string | null | undefined) ?? null,
    lastContactAt: (row.last_contact_at as string | null | undefined) ?? null,
    tags: (row.tags as string[] | null | undefined) ?? [],
  };
}

export function mapDeliverable(row: Record<string, unknown>): Deliverable {
  return {
    id: row.id as string,
    deliverableId: row.deliverable_code as string,
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
    market: (row.market as Market) ?? "SG",
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceId: row.invoice_code as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    month: row.month as string,
    amount: Number(row.amount),
    currency: row.currency as Currency,
    servicesBilled: row.services_billed as string,
    invoiceFileLink: row.file_link as string | undefined,
    status: row.status as InvoiceStatus,
    paymentDate: row.payment_date as string | undefined,
    market: (row.market as Market) ?? "SG",
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    taskId: row.task_code as string,
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
  return row;
}

export function toInvoiceRow(data: Partial<Invoice>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.month !== undefined) row.month = data.month;
  if (data.amount !== undefined) row.amount = data.amount;
  if (data.currency !== undefined) row.currency = data.currency;
  if (data.servicesBilled !== undefined) row.services_billed = data.servicesBilled;
  if (data.invoiceFileLink !== undefined) row.file_link = data.invoiceFileLink || null;
  if (data.status !== undefined) row.status = data.status;
  if (data.paymentDate !== undefined) row.payment_date = data.paymentDate || null;
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
// CONTACT TYPES
// ============================================

export type ContactRole = "primary" | "marketing" | "finance" | "executive" | "technical" | "other";

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email?: string;
  phone?: string;
  role: ContactRole;
  title?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    name: row.name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    role: row.role as ContactRole,
    title: row.title as string | undefined,
    isPrimary: row.is_primary as boolean,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toContactRow(data: Partial<Contact>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.name !== undefined) row.name = data.name;
  if (data.email !== undefined) row.email = data.email || null;
  if (data.phone !== undefined) row.phone = data.phone || null;
  if (data.role !== undefined) row.role = data.role;
  if (data.title !== undefined) row.title = data.title || null;
  if (data.isPrimary !== undefined) row.is_primary = data.isPrimary;
  if (data.notes !== undefined) row.notes = data.notes || null;
  return row;
}

// ============================================
// TEAM MEMBER TYPES
// ============================================

export type TeamRole = "owner" | "manager" | "specialist" | "freelancer";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  title?: string;
  weeklyCapacityHours: number;
  hourlyRate: number;
  market?: Market;
  avatarUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function mapTeamMember(row: Record<string, unknown>): TeamMember {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as TeamRole,
    title: row.title as string | undefined,
    weeklyCapacityHours: Number(row.weekly_capacity_hours || 40),
    hourlyRate: Number(row.hourly_rate || 0),
    market: row.market as Market | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function toTeamMemberRow(data: Partial<TeamMember>) {
  const row: Record<string, unknown> = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.email !== undefined) row.email = data.email;
  if (data.role !== undefined) row.role = data.role;
  if (data.title !== undefined) row.title = data.title || null;
  if (data.weeklyCapacityHours !== undefined) row.weekly_capacity_hours = data.weeklyCapacityHours;
  if (data.hourlyRate !== undefined) row.hourly_rate = data.hourlyRate;
  if (data.market !== undefined) row.market = data.market || null;
  if (data.avatarUrl !== undefined) row.avatar_url = data.avatarUrl || null;
  if (data.isActive !== undefined) row.is_active = data.isActive;
  return row;
}

// ============================================
// ACTIVITY LOG TYPES
// ============================================

export type ActivityAction = "created" | "updated" | "deleted" | "status_changed" | "assigned" | "commented" | "note_added";
export type ActivityEntity = "client" | "deliverable" | "invoice" | "task" | "content" | "contact";

export interface ActivityLog {
  id: string;
  clientId?: string;
  entityType: ActivityEntity;
  entityId: string;
  action: ActivityAction;
  description: string;
  performedBy: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export function mapActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    clientId: row.client_id as string | undefined,
    entityType: row.entity_type as ActivityEntity,
    entityId: row.entity_id as string,
    action: row.action as ActivityAction,
    description: row.description as string,
    performedBy: row.performed_by as string,
    metadata: row.metadata as Record<string, unknown> | undefined,
    createdAt: row.created_at as string,
  };
}

// ============================================
// PORTAL MESSAGE TYPES
// ============================================

export type PortalMessageSender = "client" | "agency";

export interface PortalMessage {
  id: string;
  clientId: string;
  deliverableId?: string;
  senderType: PortalMessageSender;
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function mapPortalMessage(row: Record<string, unknown>): PortalMessage {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    deliverableId: row.deliverable_id as string | undefined,
    senderType: row.sender_type as PortalMessageSender,
    senderName: row.sender_name as string,
    message: row.message as string,
    isRead: (row.is_read as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

// ============================================
// CLIENT ONBOARDING TYPES
// ============================================

export interface Competitor {
  name: string;
  url: string;
  notes: string;
}

export interface ClientOnboarding {
  id: string;
  portalAccessId: string;
  currentStep: number;
  completedAt?: string;
  industry?: string;
  websiteUrl?: string;
  businessDescription?: string;
  targetAudience?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontPreferences?: string;
  brandVoice?: string;
  brandDos?: string;
  brandDonts?: string;
  competitors: Competitor[];
  goals?: string;
  priority1?: string;
  priority2?: string;
  priority3?: string;
  communicationStyle?: string;
  additionalNotes?: string;
}

export function mapClientOnboarding(row: Record<string, unknown>): ClientOnboarding {
  return {
    id: row.id as string,
    portalAccessId: row.portal_access_id as string,
    currentStep: (row.current_step as number) ?? 1,
    completedAt: row.completed_at as string | undefined,
    industry: row.industry as string | undefined,
    websiteUrl: row.website_url as string | undefined,
    businessDescription: row.business_description as string | undefined,
    targetAudience: row.target_audience as string | undefined,
    primaryColor: row.primary_color as string | undefined,
    secondaryColor: row.secondary_color as string | undefined,
    fontPreferences: row.font_preferences as string | undefined,
    brandVoice: row.brand_voice as string | undefined,
    brandDos: row.brand_dos as string | undefined,
    brandDonts: row.brand_donts as string | undefined,
    competitors: (row.competitors as Competitor[]) ?? [],
    goals: row.goals as string | undefined,
    priority1: row.priority_1 as string | undefined,
    priority2: row.priority_2 as string | undefined,
    priority3: row.priority_3 as string | undefined,
    communicationStyle: row.communication_style as string | undefined,
    additionalNotes: row.additional_notes as string | undefined,
  };
}

export function toPortalMessageRow(data: Partial<PortalMessage>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId;
  if (data.deliverableId !== undefined) row.deliverable_id = data.deliverableId || null;
  if (data.senderType !== undefined) row.sender_type = data.senderType;
  if (data.senderName !== undefined) row.sender_name = data.senderName;
  if (data.message !== undefined) row.message = data.message;
  return row;
}

export function toActivityLogRow(data: Partial<ActivityLog>) {
  const row: Record<string, unknown> = {};
  if (data.clientId !== undefined) row.client_id = data.clientId || null;
  if (data.entityType !== undefined) row.entity_type = data.entityType;
  if (data.entityId !== undefined) row.entity_id = data.entityId;
  if (data.action !== undefined) row.action = data.action;
  if (data.description !== undefined) row.description = data.description;
  if (data.performedBy !== undefined) row.performed_by = data.performedBy;
  if (data.metadata !== undefined) row.metadata = data.metadata || null;
  return row;
}

// ============================================
// PROJECT TEMPLATE TYPES
// ============================================

export interface TemplateTask {
  id: string;
  templateDeliverableId: string;
  name: string;
  priority: string;
}

export interface TemplateDeliverable {
  id: string;
  templateId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  tasks?: TemplateTask[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  createdAt: string;
  deliverables?: TemplateDeliverable[];
}

export function mapTemplateTask(row: any): TemplateTask {
  return {
    id: row.id,
    templateDeliverableId: row.template_deliverable_id,
    name: row.name,
    priority: row.priority ?? 'medium',
  };
}

export function mapTemplateDeliverable(row: any): TemplateDeliverable {
  return {
    id: row.id,
    templateId: row.template_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order ?? 0,
    tasks: row.template_tasks?.map(mapTemplateTask) ?? [],
  };
}

export function mapProjectTemplate(row: any): ProjectTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category ?? 'custom',
    createdAt: row.created_at,
    deliverables: row.template_deliverables?.map(mapTemplateDeliverable) ?? [],
  };
}

// ============================================
// TIME ENTRY TYPES
// ============================================

export interface TimeEntry {
  id: string;
  taskId: string | null;
  deliverableId: string | null;
  clientId: string;
  teamMember: string;
  hours: number;
  date: string;
  notes: string | null;
  isBillable: boolean;
  hourlyRate: number | null;
  createdAt: string;
}

export function mapTimeEntry(row: any): TimeEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    deliverableId: row.deliverable_id,
    clientId: row.client_id,
    teamMember: row.team_member,
    hours: row.hours,
    date: row.date,
    notes: row.notes,
    isBillable: row.is_billable ?? true,
    hourlyRate: row.hourly_rate,
    createdAt: row.created_at,
  };
}

export function toTimeEntryRow(data: Partial<TimeEntry>) {
  return {
    task_id: data.taskId ?? null,
    deliverable_id: data.deliverableId ?? null,
    client_id: data.clientId,
    team_member: data.teamMember,
    hours: data.hours,
    date: data.date,
    notes: data.notes ?? null,
    is_billable: data.isBillable ?? true,
    hourly_rate: data.hourlyRate ?? null,
  };
}

// ============================================
// PROPOSAL TYPES
// ============================================

export interface ProposalLineItem {
  name: string;
  qty: number;
  rate: number;
}

export interface ProposalSection {
  title: string;
  items: ProposalLineItem[];
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined';

export interface Proposal {
  id: string;
  proposalCode: string | null;
  clientId: string;
  clientName?: string; // from join
  title: string;
  status: ProposalStatus;
  sections: ProposalSection[];
  totalAmount: number;
  currency: string;
  validUntil: string | null;
  notes: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapProposal(row: any): Proposal {
  return {
    id: row.id,
    proposalCode: row.proposal_code ?? null,
    clientId: row.client_id,
    clientName: row.client_name ?? row.clients?.company_name ?? undefined,
    title: row.title,
    status: row.status ?? 'draft',
    sections: Array.isArray(row.sections) ? row.sections : [],
    totalAmount: Number(row.total_amount ?? 0),
    currency: row.currency ?? 'USD',
    validUntil: row.valid_until ?? null,
    notes: row.notes ?? null,
    viewedAt: row.viewed_at ?? null,
    acceptedAt: row.accepted_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// RESOURCE LIBRARY TYPES
// ============================================

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  fileType: string | null;
  category: string;
  tags: string[];
  isPublic: boolean;
  uploadedBy: string;
  createdAt: string;
}

export function mapResource(row: any): Resource {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileSize: row.file_size,
    fileType: row.file_type,
    category: row.category ?? 'internal',
    tags: row.tags ?? [],
    isPublic: row.is_public ?? false,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}
