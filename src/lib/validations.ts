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
  primaryLanguage: z.string().optional().or(z.literal("")),
  secondaryLanguage: z.string().optional().or(z.literal("")),
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
  language: z.string().optional().or(z.literal("")),
  reviewStatus: z.enum(["none", "internal_review", "client_review", "changes_requested", "approved", "rejected"]).optional(),
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

// ============================================
// CONTENT COMMAND CENTER SCHEMAS
// ============================================

export const onboardingIntakeSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().min(1, "Industry is required"),
  targetMarkets: z.string().min(1, "Target markets are required"),
  brandVoiceDescription: z.string().optional().or(z.literal("")),
  sampleContentUrls: z.string().optional().or(z.literal("")),
  topKeywords: z.string().optional().or(z.literal("")),
  competitorUrls: z.string().optional().or(z.literal("")),
  contentGoals: z.string().optional().or(z.literal("")),
  tonePreferences: z.enum(["professional", "casual", "technical", "conversational"]).optional(),
  contentCadence: z.enum(["weekly", "bi-weekly", "monthly"]).optional(),
  publishingCredentials: z.string().optional().or(z.literal("")),
  existingContentUrl: z.string().optional().or(z.literal("")),
  primaryServices: z.string().optional().or(z.literal("")),
});

export type OnboardingIntakeFormValues = z.infer<typeof onboardingIntakeSchema>;

export const contentReviewSchema = z.object({
  action: z.enum(["approve", "request_changes", "reject"]),
  comments: z.string().optional().or(z.literal("")),
});

export type ContentReviewFormValues = z.infer<typeof contentReviewSchema>;

export const contentRequestSchema = z.object({
  contentType: z.string().min(1, "Content type is required"),
  topic: z.string().min(1, "Topic is required"),
  targetKeyword: z.string().optional().or(z.literal("")),
  priority: z.enum(["standard", "urgent", "rush"]),
  desiredDate: z.string().optional().or(z.literal("")),
  referenceUrls: z.string().optional().or(z.literal("")),
  referenceNotes: z.string().optional().or(z.literal("")),
});

export type ContentRequestFormValues = z.infer<typeof contentRequestSchema>;

export const slaDefinitionSchema = z.object({
  contentType: z.string().min(1, "Content type is required"),
  briefToDraftDays: z.coerce.number().min(1, "Must be at least 1 day"),
  draftToReviewDays: z.coerce.number().min(1, "Must be at least 1 day"),
  reviewToPublishDays: z.coerce.number().min(1, "Must be at least 1 day"),
  totalDays: z.coerce.number().min(1, "Must be at least 1 day"),
});

export type SlaDefinitionFormValues = z.infer<typeof slaDefinitionSchema>;

export const retainerTierSchema = z.object({
  name: z.string().min(1, "Tier name is required"),
  blogsPerMonth: z.coerce.number().min(0),
  servicePagesPerMonth: z.coerce.number().min(0),
  pseoPagesPerMonth: z.coerce.number().min(0),
  socialCascadesPerMonth: z.coerce.number().min(0),
  emailSequencesPerMonth: z.coerce.number().min(0),
  caseStudiesPerMonth: z.coerce.number().min(0),
  revisionsPerPiece: z.coerce.number().min(0),
  contentRequestsPerMonth: z.coerce.number().min(0),
});

export type RetainerTierFormValues = z.infer<typeof retainerTierSchema>;

export const qualityScoreSchema = z.object({
  seoScore: z.coerce.number().min(0).max(100),
  brandVoiceScore: z.coerce.number().min(0).max(100),
  uniquenessScore: z.coerce.number().min(0).max(100),
  humannessScore: z.coerce.number().min(0).max(100),
  completenessScore: z.coerce.number().min(0).max(100),
});

export type QualityScoreFormValues = z.infer<typeof qualityScoreSchema>;

export const clientReportSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  month: z.string().min(1, "Month is required"),
  summary: z.string().optional().or(z.literal("")),
  recommendations: z.string().optional().or(z.literal("")),
});

export type ClientReportFormValues = z.infer<typeof clientReportSchema>;

export const contentPerformanceSchema = z.object({
  impressions: z.coerce.number().min(0),
  clicks: z.coerce.number().min(0),
  avgPosition: z.coerce.number().min(0).optional(),
  performanceTier: z.enum(["high", "mid", "low"]).optional(),
});

export type ContentPerformanceFormValues = z.infer<typeof contentPerformanceSchema>;
