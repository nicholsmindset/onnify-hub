import { Client, Deliverable, Invoice, Task } from "@/types";

export const mockClients: Client[] = [
  { id: "1", clientId: "OW-SG-001", companyName: "PropNex Realty", market: "SG", industry: "Real Estate", planTier: "Pro", status: "Active", primaryContact: "James Tan", contractStart: "2025-06-01", contractEnd: "2026-05-31", monthlyValue: 997 },
  { id: "2", clientId: "OW-SG-002", companyName: "LiHO Tea", market: "SG", industry: "F&B", planTier: "Growth", status: "Active", primaryContact: "Sarah Lim", contractStart: "2025-09-01", contractEnd: "2026-08-31", monthlyValue: 497 },
  { id: "3", clientId: "OW-ID-001", companyName: "Tokopedia Seller Hub", market: "ID", industry: "Tech", planTier: "Pro", status: "Onboarding", primaryContact: "Budi Santoso", contractStart: "2026-01-15", monthlyValue: 997 },
  { id: "4", clientId: "OW-US-001", companyName: "Austin Dental Co", market: "US", industry: "Health", planTier: "Starter", status: "Active", primaryContact: "Mike Roberts", contractStart: "2025-11-01", contractEnd: "2026-10-31", monthlyValue: 150 },
  { id: "5", clientId: "OW-SG-003", companyName: "InsureFirst Asia", market: "SG", industry: "Insurance", planTier: "Growth", status: "Prospect", primaryContact: "Wei Lin", monthlyValue: 497 },
  { id: "6", clientId: "OW-US-002", companyName: "CloudStack SaaS", market: "US", industry: "SaaS", planTier: "Pro", status: "Active", primaryContact: "Diana Chen", contractStart: "2025-08-01", contractEnd: "2026-07-31", monthlyValue: 997 },
];

export const mockDeliverables: Deliverable[] = [
  { id: "1", deliverableId: "DEL-001", clientId: "1", clientName: "PropNex Realty", serviceType: "SEO", name: "Q1 SEO Audit Report", description: "Full site audit with recommendations", assignedTo: "Robert", priority: "High", status: "In Progress", dueDate: "2026-02-25", market: "SG", clientApproved: false },
  { id: "2", deliverableId: "DEL-002", clientId: "1", clientName: "PropNex Realty", serviceType: "Content", name: "Blog Series — Property Trends", description: "4 blog posts on 2026 property trends", assignedTo: "Lina", priority: "Medium", status: "Review", dueDate: "2026-02-28", market: "SG", clientApproved: false },
  { id: "3", deliverableId: "DEL-003", clientId: "2", clientName: "LiHO Tea", serviceType: "Paid Media", name: "Feb Facebook Ads Campaign", description: "CNY promo campaign setup", assignedTo: "Robert", priority: "High", status: "Delivered", dueDate: "2026-02-15", deliveryDate: "2026-02-14", market: "SG", clientApproved: true },
  { id: "4", deliverableId: "DEL-004", clientId: "3", clientName: "Tokopedia Seller Hub", serviceType: "CRM", name: "GHL CRM Setup", description: "Full GoHighLevel CRM onboarding", assignedTo: "Robert", priority: "High", status: "Not Started", dueDate: "2026-03-01", market: "ID", clientApproved: false },
  { id: "5", deliverableId: "DEL-005", clientId: "4", clientName: "Austin Dental Co", serviceType: "Voice AI", name: "Voice AI Receptionist", description: "Configure AI phone answering", assignedTo: "Freelancer", priority: "Medium", status: "In Progress", dueDate: "2026-02-22", market: "US", clientApproved: false },
  { id: "6", deliverableId: "DEL-006", clientId: "6", clientName: "CloudStack SaaS", serviceType: "Strategy", name: "Growth Strategy Deck", description: "Q1 growth playbook presentation", assignedTo: "Robert", priority: "High", status: "Not Started", dueDate: "2026-02-18", market: "US", clientApproved: false },
];

export const mockInvoices: Invoice[] = [
  { id: "1", invoiceId: "INV-2026-001", clientId: "1", clientName: "PropNex Realty", month: "2026-02", amount: 997, currency: "SGD", servicesBilled: "SEO + Content", status: "Sent", market: "SG" },
  { id: "2", invoiceId: "INV-2026-002", clientId: "2", clientName: "LiHO Tea", month: "2026-02", amount: 497, currency: "SGD", servicesBilled: "Paid Media", status: "Paid", paymentDate: "2026-02-10", market: "SG" },
  { id: "3", invoiceId: "INV-2026-003", clientId: "4", clientName: "Austin Dental Co", month: "2026-02", amount: 150, currency: "USD", servicesBilled: "Voice AI", status: "Draft", market: "US" },
  { id: "4", invoiceId: "INV-2026-004", clientId: "6", clientName: "CloudStack SaaS", month: "2026-01", amount: 997, currency: "USD", servicesBilled: "Strategy + SEO", status: "Overdue", market: "US" },
  { id: "5", invoiceId: "INV-2026-005", clientId: "3", clientName: "Tokopedia Seller Hub", month: "2026-02", amount: 14900000, currency: "IDR", servicesBilled: "CRM Setup", status: "Draft", market: "ID" },
];

export const mockTasks: Task[] = [
  { id: "1", taskId: "TSK-001", name: "Prepare weekly client update", assignedTo: "Robert", category: "Admin", status: "To Do", dueDate: "2026-02-21", notes: "Summary for all SG clients", clientId: "1" },
  { id: "2", taskId: "TSK-002", name: "Write blog draft #3", clientId: "1", clientName: "PropNex Realty", deliverableId: "2", assignedTo: "Lina", category: "Content", status: "In Progress", dueDate: "2026-02-22", notes: "Topic: HDB resale market" },
  { id: "3", taskId: "TSK-003", name: "Setup GHL automations", clientId: "3", clientName: "Tokopedia Seller Hub", assignedTo: "Robert", category: "Tech", status: "To Do", dueDate: "2026-02-25", notes: "Lead capture + nurture workflow" },
  { id: "4", taskId: "TSK-004", name: "Invoice follow-up CloudStack", clientId: "6", clientName: "CloudStack SaaS", assignedTo: "Robert", category: "Sales", status: "Blocked", dueDate: "2026-02-19", notes: "Jan invoice overdue — send reminder" },
  { id: "5", taskId: "TSK-005", name: "Design social templates", assignedTo: "Lina", category: "Content", status: "Done", dueDate: "2026-02-18", notes: "Instagram + LinkedIn templates done" },
  { id: "6", taskId: "TSK-006", name: "Review Voice AI scripts", clientId: "4", clientName: "Austin Dental Co", assignedTo: "Freelancer", category: "Ops", status: "In Progress", dueDate: "2026-02-23", notes: "Check greeting and FAQ flows" },
];
