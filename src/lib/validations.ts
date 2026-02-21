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

export const contentSchema = z.object({
  clientId: z.string().optional().or(z.literal("")),
  title: z.string().min(1, "Title is required"),
  contentType: z.enum(["Blog", "Social Post", "Email Campaign", "Video", "Case Study", "Newsletter"]),
  platform: z.enum(["Website", "Instagram", "LinkedIn", "Facebook", "YouTube", "Email", "TikTok"]).optional().or(z.literal("")),
  status: z.enum(["Ideation", "Draft", "Review", "Approved", "Scheduled", "Published"]),
  assignedTo: z.string().min(1, "Assignee is required"),
  dueDate: z.string().min(1, "Due date is required"),
  publishDate: z.string().optional().or(z.literal("")),
  contentBody: z.string().optional().or(z.literal("")),
  fileLink: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  market: z.enum(["SG", "ID", "US"]),
});

export type ContentFormValues = z.infer<typeof contentSchema>;

export const notificationRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  triggerType: z.enum(["overdue_deliverable", "overdue_invoice", "status_change", "upcoming_due", "new_assignment", "client_onboarding"]),
  channel: z.enum(["email", "in_app", "both"]),
  recipients: z.array(z.string()).min(1, "At least one recipient is required"),
  isActive: z.boolean(),
});

export type NotificationRuleFormValues = z.infer<typeof notificationRuleSchema>;

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
