import { z } from "zod";

export const clientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  market: z.enum(["SG", "ID", "US"]),
  industry: z.string().min(1, "Industry is required"),
  planTier: z.enum(["Starter", "Growth", "Pro"]),
  status: z.enum(["Prospect", "Onboarding", "Active", "Churned"]),
  primaryContact: z.string().min(1, "Contact name is required"),
  contractStart: z.string().optional().or(z.literal("")),
  contractEnd: z.string().optional().or(z.literal("")),
  monthlyValue: z.coerce.number().min(0, "Value must be positive"),
  ghlUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const deliverableSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  serviceType: z.enum(["SEO", "Voice AI", "CRM", "Paid Media", "Content", "Automation", "Strategy"]),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  assignedTo: z.string().min(1, "Assignee is required"),
  priority: z.enum(["High", "Medium", "Low"]),
  status: z.enum(["Not Started", "In Progress", "Review", "Delivered", "Approved"]),
  dueDate: z.string().min(1, "Due date is required"),
  market: z.enum(["SG", "ID", "US"]),
});

export type DeliverableFormValues = z.infer<typeof deliverableSchema>;

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  month: z.string().min(1, "Month is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["SGD", "USD", "IDR"]),
  servicesBilled: z.string().min(1, "Services description required"),
  status: z.enum(["Draft", "Sent", "Paid", "Overdue"]),
  paymentDate: z.string().optional().or(z.literal("")),
  market: z.enum(["SG", "ID", "US"]),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  clientId: z.string().optional().or(z.literal("")),
  deliverableId: z.string().optional().or(z.literal("")),
  assignedTo: z.string().min(1, "Assignee is required"),
  category: z.enum(["Admin", "Strategy", "Content", "Tech", "Sales", "Ops"]),
  status: z.enum(["To Do", "In Progress", "Done", "Blocked"]),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
