export type Market = "SG" | "ID" | "US";
export type ClientStatus = "Prospect" | "Onboarding" | "Active" | "Churned";
export type PlanTier = "Starter" | "Growth" | "Pro";
export type Industry = "Real Estate" | "F&B" | "Insurance" | "Health" | "Tech" | "SaaS";

export interface Client {
  id: string;
  clientId: string; // OW-SG-001
  companyName: string;
  market: Market;
  industry: Industry;
  planTier: PlanTier;
  ghlUrl?: string;
  status: ClientStatus;
  primaryContact: string;
  contractStart?: string;
  contractEnd?: string;
  monthlyValue: number;
}

export type ServiceType = "SEO" | "Voice AI" | "CRM" | "Paid Media" | "Content" | "Automation" | "Strategy";
export type Priority = "High" | "Medium" | "Low";
export type DeliverableStatus = "Not Started" | "In Progress" | "Review" | "Delivered" | "Approved";

export interface Deliverable {
  id: string;
  deliverableId: string;
  clientId: string;
  clientName: string;
  serviceType: ServiceType;
  name: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  status: DeliverableStatus;
  dueDate: string;
  deliveryDate?: string;
  fileLink?: string;
  clientApproved: boolean;
  market: Market;
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type Currency = "SGD" | "USD" | "IDR";

export interface Invoice {
  id: string;
  invoiceId: string; // INV-2026-001
  clientId: string;
  clientName: string;
  month: string;
  amount: number;
  currency: Currency;
  servicesBilled: string;
  invoiceFileLink?: string;
  status: InvoiceStatus;
  paymentDate?: string;
  market: Market;
}

export type TaskStatus = "To Do" | "In Progress" | "Done" | "Blocked";
export type TaskCategory = "Admin" | "Strategy" | "Content" | "Tech" | "Sales" | "Ops";

export interface Task {
  id: string;
  taskId: string;
  name: string;
  clientId?: string;
  clientName?: string;
  deliverableId?: string;
  assignedTo: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string;
  notes: string;
}
