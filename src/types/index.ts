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
