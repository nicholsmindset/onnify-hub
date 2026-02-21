import { describe, it, expect } from "vitest";
import {
  clientSchema,
  deliverableSchema,
  invoiceSchema,
  taskSchema,
  contentSchema,
  notificationRuleSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations";

// ============================================
// clientSchema
// ============================================
describe("clientSchema", () => {
  const validClient = {
    companyName: "Acme Corp",
    market: "SG",
    industry: "Tech",
    planTier: "Pro",
    status: "Active",
    primaryContact: "John Doe",
    monthlyValue: 997,
  };

  it("should accept valid client data", () => {
    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
  });

  it("should accept valid client data with optional fields", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      contractStart: "2025-01-01",
      contractEnd: "2025-12-31",
      ghlUrl: "https://ghl.example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for optional contractStart", () => {
    const result = clientSchema.safeParse({ ...validClient, contractStart: "" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for ghlUrl", () => {
    const result = clientSchema.safeParse({ ...validClient, ghlUrl: "" });
    expect(result.success).toBe(true);
  });

  it("should reject empty companyName", () => {
    const result = clientSchema.safeParse({ ...validClient, companyName: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty industry", () => {
    const result = clientSchema.safeParse({ ...validClient, industry: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty primaryContact", () => {
    const result = clientSchema.safeParse({ ...validClient, primaryContact: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid market", () => {
    const result = clientSchema.safeParse({ ...validClient, market: "UK" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid planTier", () => {
    const result = clientSchema.safeParse({ ...validClient, planTier: "Enterprise" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = clientSchema.safeParse({ ...validClient, status: "Suspended" });
    expect(result.success).toBe(false);
  });

  it("should reject negative monthlyValue", () => {
    const result = clientSchema.safeParse({ ...validClient, monthlyValue: -1 });
    expect(result.success).toBe(false);
  });

  it("should accept zero monthlyValue", () => {
    const result = clientSchema.safeParse({ ...validClient, monthlyValue: 0 });
    expect(result.success).toBe(true);
  });

  it("should coerce string monthlyValue to number", () => {
    const result = clientSchema.safeParse({ ...validClient, monthlyValue: "997" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.monthlyValue).toBe(997);
    }
  });

  it("should reject invalid ghlUrl (non-URL string)", () => {
    const result = clientSchema.safeParse({ ...validClient, ghlUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid markets", () => {
    for (const market of ["SG", "ID", "US"]) {
      const result = clientSchema.safeParse({ ...validClient, market });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid plan tiers", () => {
    for (const planTier of ["Starter", "Growth", "Pro"]) {
      const result = clientSchema.safeParse({ ...validClient, planTier });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid statuses", () => {
    for (const status of ["Prospect", "Onboarding", "Active", "Churned"]) {
      const result = clientSchema.safeParse({ ...validClient, status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// deliverableSchema
// ============================================
describe("deliverableSchema", () => {
  const validDeliverable = {
    clientId: "c1",
    serviceType: "SEO",
    name: "Q1 Audit",
    assignedTo: "Robert",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-02-25",
    market: "SG",
  };

  it("should accept valid deliverable data", () => {
    const result = deliverableSchema.safeParse(validDeliverable);
    expect(result.success).toBe(true);
  });

  it("should accept optional description", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, description: "Full audit" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for description", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, description: "" });
    expect(result.success).toBe(true);
  });

  it("should reject empty clientId", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, clientId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty assignedTo", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, assignedTo: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty dueDate", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, dueDate: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid serviceType", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, serviceType: "Marketing" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid priority", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, priority: "Critical" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = deliverableSchema.safeParse({ ...validDeliverable, status: "Cancelled" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid service types", () => {
    for (const serviceType of ["SEO", "Voice AI", "CRM", "Paid Media", "Content", "Automation", "Strategy"]) {
      const result = deliverableSchema.safeParse({ ...validDeliverable, serviceType });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid statuses", () => {
    for (const status of ["Not Started", "In Progress", "Review", "Delivered", "Approved"]) {
      const result = deliverableSchema.safeParse({ ...validDeliverable, status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// invoiceSchema
// ============================================
describe("invoiceSchema", () => {
  const validInvoice = {
    clientId: "c1",
    month: "2026-02",
    amount: 997,
    currency: "SGD",
    servicesBilled: "SEO + Content",
    status: "Draft",
    market: "SG",
  };

  it("should accept valid invoice data", () => {
    const result = invoiceSchema.safeParse(validInvoice);
    expect(result.success).toBe(true);
  });

  it("should accept optional paymentDate", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, paymentDate: "2026-02-15" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for paymentDate", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, paymentDate: "" });
    expect(result.success).toBe(true);
  });

  it("should reject empty clientId", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, clientId: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty month", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, month: "" });
    expect(result.success).toBe(false);
  });

  it("should reject zero amount", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject negative amount", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, amount: -100 });
    expect(result.success).toBe(false);
  });

  it("should coerce string amount to number", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, amount: "997" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(997);
    }
  });

  it("should reject empty servicesBilled", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, servicesBilled: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid currency", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, currency: "EUR" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, status: "Cancelled" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid currencies", () => {
    for (const currency of ["SGD", "USD", "IDR"]) {
      const result = invoiceSchema.safeParse({ ...validInvoice, currency });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid statuses", () => {
    for (const status of ["Draft", "Sent", "Paid", "Overdue"]) {
      const result = invoiceSchema.safeParse({ ...validInvoice, status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// taskSchema
// ============================================
describe("taskSchema", () => {
  const validTask = {
    name: "Write blog post",
    assignedTo: "Lina",
    category: "Content",
    status: "To Do",
    dueDate: "2026-02-22",
  };

  it("should accept valid task data", () => {
    const result = taskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it("should accept optional clientId and deliverableId", () => {
    const result = taskSchema.safeParse({ ...validTask, clientId: "c1", deliverableId: "d1" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for clientId", () => {
    const result = taskSchema.safeParse({ ...validTask, clientId: "" });
    expect(result.success).toBe(true);
  });

  it("should accept empty string for deliverableId", () => {
    const result = taskSchema.safeParse({ ...validTask, deliverableId: "" });
    expect(result.success).toBe(true);
  });

  it("should accept optional notes", () => {
    const result = taskSchema.safeParse({ ...validTask, notes: "Important" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = taskSchema.safeParse({ ...validTask, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty assignedTo", () => {
    const result = taskSchema.safeParse({ ...validTask, assignedTo: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty dueDate", () => {
    const result = taskSchema.safeParse({ ...validTask, dueDate: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid category", () => {
    const result = taskSchema.safeParse({ ...validTask, category: "Marketing" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = taskSchema.safeParse({ ...validTask, status: "Cancelled" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid categories", () => {
    for (const category of ["Admin", "Strategy", "Content", "Tech", "Sales", "Ops"]) {
      const result = taskSchema.safeParse({ ...validTask, category });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid statuses", () => {
    for (const status of ["To Do", "In Progress", "Done", "Blocked"]) {
      const result = taskSchema.safeParse({ ...validTask, status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// contentSchema
// ============================================
describe("contentSchema", () => {
  const validContent = {
    title: "Blog Post",
    contentType: "Blog",
    status: "Draft",
    assignedTo: "Lina",
    dueDate: "2026-02-28",
    market: "SG",
  };

  it("should accept valid content data", () => {
    const result = contentSchema.safeParse(validContent);
    expect(result.success).toBe(true);
  });

  it("should accept optional fields", () => {
    const result = contentSchema.safeParse({
      ...validContent,
      clientId: "c1",
      platform: "Website",
      publishDate: "2026-03-01",
      contentBody: "Lorem ipsum",
      fileLink: "https://drive.google.com",
      notes: "Review needed",
    });
    expect(result.success).toBe(true);
  });

  it("should accept empty strings for optional fields", () => {
    const result = contentSchema.safeParse({
      ...validContent,
      clientId: "",
      platform: "",
      publishDate: "",
      contentBody: "",
      fileLink: "",
      notes: "",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const result = contentSchema.safeParse({ ...validContent, title: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty assignedTo", () => {
    const result = contentSchema.safeParse({ ...validContent, assignedTo: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty dueDate", () => {
    const result = contentSchema.safeParse({ ...validContent, dueDate: "" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid contentType", () => {
    const result = contentSchema.safeParse({ ...validContent, contentType: "Podcast" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid status", () => {
    const result = contentSchema.safeParse({ ...validContent, status: "Deleted" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid platform", () => {
    const result = contentSchema.safeParse({ ...validContent, platform: "Twitter" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid content types", () => {
    for (const contentType of ["Blog", "Social Post", "Email Campaign", "Video", "Case Study", "Newsletter"]) {
      const result = contentSchema.safeParse({ ...validContent, contentType });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid platforms", () => {
    for (const platform of ["Website", "Instagram", "LinkedIn", "Facebook", "YouTube", "Email", "TikTok"]) {
      const result = contentSchema.safeParse({ ...validContent, platform });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid statuses", () => {
    for (const status of ["Ideation", "Draft", "Review", "Approved", "Scheduled", "Published"]) {
      const result = contentSchema.safeParse({ ...validContent, status });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================
// notificationRuleSchema
// ============================================
describe("notificationRuleSchema", () => {
  const validRule = {
    name: "Overdue Alert",
    triggerType: "overdue_deliverable",
    channel: "email",
    recipients: ["admin@example.com"],
    isActive: true,
  };

  it("should accept valid notification rule data", () => {
    const result = notificationRuleSchema.safeParse(validRule);
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = notificationRuleSchema.safeParse({ ...validRule, name: "" });
    expect(result.success).toBe(false);
  });

  it("should reject empty recipients array", () => {
    const result = notificationRuleSchema.safeParse({ ...validRule, recipients: [] });
    expect(result.success).toBe(false);
  });

  it("should reject invalid triggerType", () => {
    const result = notificationRuleSchema.safeParse({ ...validRule, triggerType: "custom" });
    expect(result.success).toBe(false);
  });

  it("should reject invalid channel", () => {
    const result = notificationRuleSchema.safeParse({ ...validRule, channel: "sms" });
    expect(result.success).toBe(false);
  });

  it("should accept all valid trigger types", () => {
    for (const triggerType of [
      "overdue_deliverable",
      "overdue_invoice",
      "status_change",
      "upcoming_due",
      "new_assignment",
      "client_onboarding",
    ]) {
      const result = notificationRuleSchema.safeParse({ ...validRule, triggerType });
      expect(result.success).toBe(true);
    }
  });

  it("should accept all valid channels", () => {
    for (const channel of ["email", "in_app", "both"]) {
      const result = notificationRuleSchema.safeParse({ ...validRule, channel });
      expect(result.success).toBe(true);
    }
  });

  it("should accept multiple recipients", () => {
    const result = notificationRuleSchema.safeParse({
      ...validRule,
      recipients: ["a@b.com", "c@d.com", "e@f.com"],
    });
    expect(result.success).toBe(true);
  });

  it("should accept isActive as false", () => {
    const result = notificationRuleSchema.safeParse({ ...validRule, isActive: false });
    expect(result.success).toBe(true);
  });
});

// ============================================
// loginSchema
// ============================================
describe("loginSchema", () => {
  it("should accept valid login credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("should reject short password (less than 6 chars)", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "12345" });
    expect(result.success).toBe(false);
  });

  it("should accept exactly 6 character password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("should reject missing email", () => {
    const result = loginSchema.safeParse({ password: "password123" });
    expect(result.success).toBe(false);
  });

  it("should reject missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });
});

// ============================================
// registerSchema
// ============================================
describe("registerSchema", () => {
  const validRegister = {
    fullName: "John Doe",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse(validRegister);
    expect(result.success).toBe(true);
  });

  it("should reject when passwords don't match", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      expect(confirmError?.message).toBe("Passwords don't match");
    }
  });

  it("should reject short fullName (less than 2 chars)", () => {
    const result = registerSchema.safeParse({ ...validRegister, fullName: "J" });
    expect(result.success).toBe(false);
  });

  it("should accept 2 character fullName", () => {
    const result = registerSchema.safeParse({ ...validRegister, fullName: "Jo" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({ ...validRegister, email: "invalid" });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = registerSchema.safeParse({ ...validRegister, password: "12345", confirmPassword: "12345" });
    expect(result.success).toBe(false);
  });

  it("should reject short confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...validRegister,
      password: "123456",
      confirmPassword: "12345",
    });
    expect(result.success).toBe(false);
  });
});
