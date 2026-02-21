import type { Client, Deliverable, Invoice, Task, ContentItem, UserProfile } from "@/types";

export const DEMO_PROFILE: UserProfile = {
  id: "demo-user-001",
  email: "demo@onnify.com",
  fullName: "Demo User",
  role: "admin",
  market: "SG",
};

export const DEMO_CLIENTS: Client[] = [
  { id: "c1", clientId: "OW-SG-001", companyName: "Acme Corp", market: "SG", industry: "Real Estate", planTier: "Pro", status: "Active", primaryContact: "John Tan", contractStart: "2025-01-01", contractEnd: "2026-12-31", monthlyValue: 3500 },
  { id: "c2", clientId: "OW-SG-002", companyName: "GlobalFin Pte Ltd", market: "SG", industry: "Insurance", planTier: "Growth", status: "Active", primaryContact: "Sarah Lim", contractStart: "2025-03-01", contractEnd: "2026-06-30", monthlyValue: 2800 },
  { id: "c3", clientId: "OW-US-001", companyName: "TechStart Inc", market: "US", industry: "SaaS", planTier: "Starter", status: "Active", primaryContact: "Mike Chen", contractStart: "2025-06-01", contractEnd: "2026-05-31", monthlyValue: 1200 },
  { id: "c4", clientId: "OW-ID-001", companyName: "NovaPay", market: "ID", industry: "Tech", planTier: "Pro", status: "Active", primaryContact: "Rina Dewi", contractStart: "2025-02-01", contractEnd: "2026-01-31", monthlyValue: 4000 },
  { id: "c5", clientId: "OW-SG-003", companyName: "FreshBites SG", market: "SG", industry: "F&B", planTier: "Starter", status: "Onboarding", primaryContact: "Wei Ming", contractStart: "2026-02-01", contractEnd: "2027-01-31", monthlyValue: 900 },
  { id: "c6", clientId: "OW-ID-002", companyName: "HealthPlus ID", market: "ID", industry: "Health", planTier: "Growth", status: "Active", primaryContact: "Budi Santoso", contractStart: "2025-08-01", contractEnd: "2026-07-31", monthlyValue: 2200 },
  { id: "c7", clientId: "OW-US-002", companyName: "CloudNine Labs", market: "US", industry: "SaaS", planTier: "Growth", status: "Active", primaryContact: "Emily Davis", contractStart: "2025-09-01", contractEnd: "2026-08-31", monthlyValue: 3100 },
  { id: "c8", clientId: "OW-SG-004", companyName: "OldClient Co", market: "SG", industry: "Real Estate", planTier: "Starter", status: "Churned", primaryContact: "James Wong", contractStart: "2024-01-01", contractEnd: "2025-06-30", monthlyValue: 800 },
];

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const DEMO_DELIVERABLES: Deliverable[] = [
  { id: "d1", deliverableId: "DEL-001", clientId: "c1", clientName: "Acme Corp", serviceType: "SEO", name: "Monthly SEO Report", assignedTo: "Jon", priority: "High", status: "In Progress", dueDate: fmt(addDays(today, 3)), clientApproved: false, market: "SG" },
  { id: "d2", deliverableId: "DEL-002", clientId: "c1", clientName: "Acme Corp", serviceType: "Content", name: "Social Media Calendar", assignedTo: "Jon", priority: "High", status: "Not Started", dueDate: fmt(addDays(today, -3)), clientApproved: false, market: "SG" },
  { id: "d3", deliverableId: "DEL-003", clientId: "c2", clientName: "GlobalFin Pte Ltd", serviceType: "Content", name: "Blog Post Batch", assignedTo: "May", priority: "Medium", status: "Review", dueDate: fmt(addDays(today, -5)), clientApproved: false, market: "SG" },
  { id: "d4", deliverableId: "DEL-004", clientId: "c3", clientName: "TechStart Inc", serviceType: "Strategy", name: "Monthly Report - Feb", assignedTo: "May", priority: "Medium", status: "Not Started", dueDate: fmt(addDays(today, 5)), clientApproved: false, market: "US" },
  { id: "d5", deliverableId: "DEL-005", clientId: "c4", clientName: "NovaPay", serviceType: "Paid Media", name: "Ad Campaign Setup", assignedTo: "Jon", priority: "High", status: "In Progress", dueDate: fmt(addDays(today, 6)), clientApproved: false, market: "ID" },
  { id: "d6", deliverableId: "DEL-006", clientId: "c6", clientName: "HealthPlus ID", serviceType: "CRM", name: "CRM Integration", assignedTo: "May", priority: "Low", status: "Delivered", dueDate: fmt(addDays(today, -10)), deliveryDate: fmt(addDays(today, -11)), clientApproved: true, market: "ID" },
  { id: "d7", deliverableId: "DEL-007", clientId: "c7", clientName: "CloudNine Labs", serviceType: "Automation", name: "Email Automation Flow", assignedTo: "Jon", priority: "Medium", status: "In Progress", dueDate: fmt(addDays(today, 2)), clientApproved: false, market: "US" },
  { id: "d8", deliverableId: "DEL-008", clientId: "c5", clientName: "FreshBites SG", serviceType: "Content", name: "Brand Guidelines Doc", assignedTo: "May", priority: "High", status: "Not Started", dueDate: fmt(addDays(today, 4)), clientApproved: false, market: "SG" },
];

export const DEMO_INVOICES: Invoice[] = [
  { id: "i1", invoiceId: "INV-2026-001", clientId: "c1", clientName: "Acme Corp", month: "2026-02", amount: 3500, currency: "SGD", servicesBilled: "SEO, Content", status: "Paid", paymentDate: "2026-02-10", market: "SG" },
  { id: "i2", invoiceId: "INV-2026-002", clientId: "c2", clientName: "GlobalFin Pte Ltd", month: "2026-02", amount: 2800, currency: "SGD", servicesBilled: "Content, Strategy", status: "Sent", market: "SG" },
  { id: "i3", invoiceId: "INV-2026-003", clientId: "c3", clientName: "TechStart Inc", month: "2026-02", amount: 1200, currency: "USD", servicesBilled: "Strategy", status: "Paid", paymentDate: "2026-02-05", market: "US" },
  { id: "i4", invoiceId: "INV-2026-004", clientId: "c4", clientName: "NovaPay", month: "2026-02", amount: 4000, currency: "SGD", servicesBilled: "Paid Media, CRM", status: "Overdue", market: "ID" },
  { id: "i5", invoiceId: "INV-2026-005", clientId: "c6", clientName: "HealthPlus ID", month: "2026-02", amount: 2200, currency: "SGD", servicesBilled: "CRM", status: "Sent", market: "ID" },
  { id: "i6", invoiceId: "INV-2026-006", clientId: "c7", clientName: "CloudNine Labs", month: "2026-02", amount: 3100, currency: "USD", servicesBilled: "Automation, SEO", status: "Paid", paymentDate: "2026-02-15", market: "US" },
  { id: "i7", invoiceId: "INV-2026-007", clientId: "c1", clientName: "Acme Corp", month: "2026-01", amount: 3500, currency: "SGD", servicesBilled: "SEO, Content", status: "Paid", paymentDate: "2026-01-12", market: "SG" },
  { id: "i8", invoiceId: "INV-2026-008", clientId: "c4", clientName: "NovaPay", month: "2026-01", amount: 4000, currency: "SGD", servicesBilled: "Paid Media, CRM", status: "Paid", paymentDate: "2026-01-18", market: "ID" },
];

export const DEMO_TASKS: Task[] = [
  { id: "t1", taskId: "TSK-001", name: "Update SEO keywords", clientId: "c1", clientName: "Acme Corp", assignedTo: "Jon", category: "Content", status: "To Do", dueDate: fmt(addDays(today, 4)) },
  { id: "t2", taskId: "TSK-002", name: "Write ad copy for Q1", clientId: "c4", clientName: "NovaPay", assignedTo: "May", category: "Content", status: "To Do", dueDate: fmt(addDays(today, 5)) },
  { id: "t3", taskId: "TSK-003", name: "Design review meeting", clientId: "c4", clientName: "NovaPay", assignedTo: "May", category: "Strategy", status: "In Progress", dueDate: fmt(addDays(today, 1)) },
  { id: "t4", taskId: "TSK-004", name: "Invoice audit - Jan", clientId: "c2", clientName: "GlobalFin Pte Ltd", assignedTo: "Jon", category: "Admin", status: "In Progress", dueDate: fmt(addDays(today, 2)) },
  { id: "t5", taskId: "TSK-005", name: "Client onboarding call", clientId: "c5", clientName: "FreshBites SG", assignedTo: "Jon", category: "Sales", status: "To Do", dueDate: fmt(addDays(today, 3)) },
  { id: "t6", taskId: "TSK-006", name: "Monthly report - Feb", clientId: "c3", clientName: "TechStart Inc", assignedTo: "May", category: "Ops", status: "To Do", dueDate: fmt(addDays(today, 6)) },
  { id: "t7", taskId: "TSK-007", name: "Fix CRM sync issue", clientId: "c6", clientName: "HealthPlus ID", assignedTo: "Jon", category: "Tech", status: "Blocked", dueDate: fmt(addDays(today, -1)), notes: "Waiting on API access from vendor" },
  { id: "t8", taskId: "TSK-008", name: "Client call - Acme", clientId: "c1", clientName: "Acme Corp", assignedTo: "Jon", category: "Sales", status: "Done", dueDate: fmt(addDays(today, -2)) },
  { id: "t9", taskId: "TSK-009", name: "Content calendar review", clientId: "c7", clientName: "CloudNine Labs", assignedTo: "May", category: "Content", status: "Done", dueDate: fmt(addDays(today, -3)) },
  { id: "t10", taskId: "TSK-010", name: "Setup email automation", clientId: "c7", clientName: "CloudNine Labs", assignedTo: "Jon", category: "Tech", status: "In Progress", dueDate: fmt(addDays(today, 3)) },
  { id: "t11", taskId: "TSK-011", name: "Prepare pitch deck", assignedTo: "May", category: "Sales", status: "Done", dueDate: fmt(addDays(today, -5)) },
  { id: "t12", taskId: "TSK-012", name: "Update SOPs", assignedTo: "Jon", category: "Ops", status: "Done", dueDate: fmt(addDays(today, -4)) },
];

export const DEMO_CONTENT: ContentItem[] = [
  { id: "ct1", contentId: "CNT-001", clientId: "c1", clientName: "Acme Corp", title: "5 Real Estate Trends 2026", contentType: "Blog", platform: "Website", status: "Published", assignedTo: "May", dueDate: fmt(addDays(today, -7)), publishDate: fmt(addDays(today, -6)), market: "SG" },
  { id: "ct2", contentId: "CNT-002", clientId: "c1", clientName: "Acme Corp", title: "Property Showcase Reel", contentType: "Social Post", platform: "Instagram", status: "Scheduled", assignedTo: "Jon", dueDate: fmt(addDays(today, 1)), market: "SG" },
  { id: "ct3", contentId: "CNT-003", clientId: "c4", clientName: "NovaPay", title: "FinTech Innovation Newsletter", contentType: "Newsletter", platform: "Email", status: "Draft", assignedTo: "May", dueDate: fmt(addDays(today, 4)), market: "ID" },
  { id: "ct4", contentId: "CNT-004", clientId: "c3", clientName: "TechStart Inc", title: "Product Launch Case Study", contentType: "Case Study", platform: "Website", status: "Review", assignedTo: "Jon", dueDate: fmt(addDays(today, 3)), market: "US" },
  { id: "ct5", contentId: "CNT-005", clientId: "c7", clientName: "CloudNine Labs", title: "SaaS Growth Playbook", contentType: "Blog", platform: "LinkedIn", status: "Ideation", assignedTo: "May", dueDate: fmt(addDays(today, 8)), market: "US" },
  { id: "ct6", contentId: "CNT-006", clientId: "c2", clientName: "GlobalFin Pte Ltd", title: "Insurance Tips Video", contentType: "Video", platform: "YouTube", status: "Draft", assignedTo: "Jon", dueDate: fmt(addDays(today, 6)), market: "SG" },
];

export function isDemoMode(): boolean {
  return localStorage.getItem("onnify_demo_mode") === "true";
}

export function enableDemoMode(): void {
  localStorage.setItem("onnify_demo_mode", "true");
}

export function disableDemoMode(): void {
  localStorage.removeItem("onnify_demo_mode");
}
