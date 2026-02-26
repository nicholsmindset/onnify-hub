import { describe, it, expect } from "vitest";
import {
  mapClient,
  mapDeliverable,
  mapInvoice,
  mapTask,
  mapUserProfile,
  mapContentItem,
  mapGhlConnection,
  mapNotificationRule,
  mapNotification,
  mapPortalAccess,
  toClientRow,
  toDeliverableRow,
  toInvoiceRow,
  toTaskRow,
  toContentItemRow,
  toGhlConnectionRow,
  toNotificationRuleRow,
  toPortalAccessRow,
} from "@/types";

// ============================================
// mapClient
// ============================================
describe("mapClient", () => {
  it("should convert a snake_case DB row to a camelCase Client", () => {
    const row = {
      id: "uuid-1",
      client_id: "OW-SG-001",
      company_name: "Acme Corp",
      market: "SG",
      industry: "Tech",
      plan_tier: "Pro",
      ghl_url: "https://ghl.example.com",
      status: "Active",
      primary_contact: "John Doe",
      contract_start: "2025-01-01",
      contract_end: "2025-12-31",
      monthly_value: 997,
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-06-01T00:00:00Z",
    };

    const client = mapClient(row);

    expect(client).toEqual({
      id: "uuid-1",
      clientId: "OW-SG-001",
      companyName: "Acme Corp",
      market: "SG",
      industry: "Tech",
      planTier: "Pro",
      ghlUrl: "https://ghl.example.com",
      status: "Active",
      primaryContact: "John Doe",
      contractStart: "2025-01-01",
      contractEnd: "2025-12-31",
      monthlyValue: 997,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    });
  });

  it("should handle missing optional fields as undefined", () => {
    const row = {
      id: "uuid-2",
      client_id: "OW-ID-001",
      company_name: "Test Inc",
      market: "ID",
      industry: "F&B",
      plan_tier: "Starter",
      status: "Prospect",
      primary_contact: "Jane",
      monthly_value: 0,
    };

    const client = mapClient(row);

    expect(client.ghlUrl).toBeUndefined();
    expect(client.contractStart).toBeUndefined();
    expect(client.contractEnd).toBeUndefined();
    expect(client.createdAt).toBeUndefined();
    expect(client.updatedAt).toBeUndefined();
  });

  it("should coerce monthly_value to a number", () => {
    const row = {
      id: "1",
      client_id: "X",
      company_name: "X",
      market: "SG",
      industry: "X",
      plan_tier: "Pro",
      status: "Active",
      primary_contact: "X",
      monthly_value: "497",
    };

    const client = mapClient(row);
    expect(client.monthlyValue).toBe(497);
    expect(typeof client.monthlyValue).toBe("number");
  });
});

// ============================================
// toClientRow
// ============================================
describe("toClientRow", () => {
  it("should convert camelCase Client fields to snake_case", () => {
    const data = {
      companyName: "Acme Corp",
      market: "SG" as const,
      industry: "Tech",
      planTier: "Pro" as const,
      status: "Active" as const,
      primaryContact: "John",
      monthlyValue: 997,
    };

    const row = toClientRow(data);

    expect(row).toEqual({
      company_name: "Acme Corp",
      market: "SG",
      industry: "Tech",
      plan_tier: "Pro",
      status: "Active",
      primary_contact: "John",
      monthly_value: 997,
    });
  });

  it("should only include defined fields", () => {
    const row = toClientRow({ companyName: "Test" });
    expect(row).toEqual({ company_name: "Test" });
    expect(Object.keys(row)).toHaveLength(1);
  });

  it("should convert empty ghlUrl to null", () => {
    const row = toClientRow({ ghlUrl: "" });
    expect(row).toEqual({ ghl_url: null });
  });

  it("should convert empty contractStart/End to null", () => {
    const row = toClientRow({ contractStart: "", contractEnd: "" });
    expect(row).toEqual({ contract_start: null, contract_end: null });
  });

  it("should preserve valid ghlUrl", () => {
    const row = toClientRow({ ghlUrl: "https://app.ghl.com" });
    expect(row).toEqual({ ghl_url: "https://app.ghl.com" });
  });
});

// ============================================
// mapDeliverable
// ============================================
describe("mapDeliverable", () => {
  it("should convert a snake_case DB row to a camelCase Deliverable", () => {
    const row = {
      id: "del-uuid",
      deliverable_id: "DEL-001",
      client_id: "client-uuid",
      client_name: "Test Corp",
      service_type: "SEO",
      name: "Q1 Audit",
      description: "Full audit",
      assigned_to: "Robert",
      priority: "High",
      status: "In Progress",
      due_date: "2026-02-25",
      delivery_date: "2026-02-24",
      file_link: "https://drive.google.com/file",
      client_approved: true,
      market: "SG",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const deliverable = mapDeliverable(row);

    expect(deliverable.id).toBe("del-uuid");
    expect(deliverable.deliverableId).toBe("DEL-001");
    expect(deliverable.clientId).toBe("client-uuid");
    expect(deliverable.clientName).toBe("Test Corp");
    expect(deliverable.serviceType).toBe("SEO");
    expect(deliverable.name).toBe("Q1 Audit");
    expect(deliverable.description).toBe("Full audit");
    expect(deliverable.assignedTo).toBe("Robert");
    expect(deliverable.priority).toBe("High");
    expect(deliverable.status).toBe("In Progress");
    expect(deliverable.dueDate).toBe("2026-02-25");
    expect(deliverable.deliveryDate).toBe("2026-02-24");
    expect(deliverable.fileLink).toBe("https://drive.google.com/file");
    expect(deliverable.clientApproved).toBe(true);
    expect(deliverable.market).toBe("SG");
  });

  it("should handle missing optional fields", () => {
    const row = {
      id: "1",
      deliverable_id: "DEL-X",
      client_id: "c1",
      service_type: "CRM",
      name: "Setup",
      assigned_to: "Lina",
      priority: "Low",
      status: "Not Started",
      due_date: "2026-03-01",
      client_approved: false,
      market: "ID",
    };

    const deliverable = mapDeliverable(row);
    expect(deliverable.clientName).toBeUndefined();
    expect(deliverable.description).toBeUndefined();
    expect(deliverable.deliveryDate).toBeUndefined();
    expect(deliverable.fileLink).toBeUndefined();
  });
});

// ============================================
// toDeliverableRow
// ============================================
describe("toDeliverableRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toDeliverableRow({
      clientId: "c1",
      serviceType: "SEO",
      name: "Audit",
      assignedTo: "Robert",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-02-25",
      market: "SG",
      clientApproved: false,
    });

    expect(row).toEqual({
      client_id: "c1",
      service_type: "SEO",
      name: "Audit",
      assigned_to: "Robert",
      priority: "High",
      status: "In Progress",
      due_date: "2026-02-25",
      market: "SG",
      client_approved: false,
    });
  });

  it("should convert empty description to null", () => {
    const row = toDeliverableRow({ description: "" });
    expect(row).toEqual({ description: null });
  });

  it("should convert empty fileLink and deliveryDate to null", () => {
    const row = toDeliverableRow({ fileLink: "", deliveryDate: "" });
    expect(row).toEqual({ file_link: null, delivery_date: null });
  });
});

// ============================================
// mapInvoice
// ============================================
describe("mapInvoice", () => {
  it("should convert DB row to Invoice", () => {
    const row = {
      id: "inv-uuid",
      invoice_id: "INV-2026-001",
      client_id: "c1",
      client_name: "PropNex",
      month: "2026-02",
      amount: 997,
      currency: "SGD",
      services_billed: "SEO + Content",
      invoice_file_link: "https://example.com/inv.pdf",
      status: "Sent",
      payment_date: "2026-02-15",
      market: "SG",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const invoice = mapInvoice(row);

    expect(invoice.id).toBe("inv-uuid");
    expect(invoice.invoiceId).toBe("INV-2026-001");
    expect(invoice.clientId).toBe("c1");
    expect(invoice.clientName).toBe("PropNex");
    expect(invoice.month).toBe("2026-02");
    expect(invoice.amount).toBe(997);
    expect(invoice.currency).toBe("SGD");
    expect(invoice.servicesBilled).toBe("SEO + Content");
    expect(invoice.invoiceFileLink).toBe("https://example.com/inv.pdf");
    expect(invoice.status).toBe("Sent");
    expect(invoice.paymentDate).toBe("2026-02-15");
    expect(invoice.market).toBe("SG");
  });

  it("should coerce amount to number", () => {
    const row = {
      id: "1",
      invoice_id: "INV-X",
      client_id: "c1",
      month: "2026-01",
      amount: "14900000",
      currency: "IDR",
      services_billed: "CRM",
      status: "Draft",
      market: "ID",
    };

    const invoice = mapInvoice(row);
    expect(invoice.amount).toBe(14900000);
    expect(typeof invoice.amount).toBe("number");
  });
});

// ============================================
// toInvoiceRow
// ============================================
describe("toInvoiceRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toInvoiceRow({
      clientId: "c1",
      month: "2026-02",
      amount: 997,
      currency: "SGD",
      servicesBilled: "SEO",
      status: "Draft",
      market: "SG",
    });

    expect(row).toEqual({
      client_id: "c1",
      month: "2026-02",
      amount: 997,
      currency: "SGD",
      services_billed: "SEO",
      status: "Draft",
      market: "SG",
    });
  });

  it("should convert empty optional fields to null", () => {
    const row = toInvoiceRow({ invoiceFileLink: "", paymentDate: "" });
    expect(row).toEqual({ invoice_file_link: null, payment_date: null });
  });
});

// ============================================
// mapTask
// ============================================
describe("mapTask", () => {
  it("should convert DB row to Task", () => {
    const row = {
      id: "task-uuid",
      task_id: "TSK-001",
      name: "Write blog post",
      client_id: "c1",
      client_name: "PropNex",
      deliverable_id: "d1",
      deliverable_name: "Blog Series",
      assigned_to: "Lina",
      category: "Content",
      status: "In Progress",
      due_date: "2026-02-22",
      notes: "Draft #3",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const task = mapTask(row);

    expect(task.id).toBe("task-uuid");
    expect(task.taskId).toBe("TSK-001");
    expect(task.name).toBe("Write blog post");
    expect(task.clientId).toBe("c1");
    expect(task.clientName).toBe("PropNex");
    expect(task.deliverableId).toBe("d1");
    expect(task.deliverableName).toBe("Blog Series");
    expect(task.assignedTo).toBe("Lina");
    expect(task.category).toBe("Content");
    expect(task.status).toBe("In Progress");
    expect(task.dueDate).toBe("2026-02-22");
    expect(task.notes).toBe("Draft #3");
  });

  it("should handle tasks without client or deliverable", () => {
    const row = {
      id: "1",
      task_id: "TSK-X",
      name: "Admin task",
      assigned_to: "Robert",
      category: "Admin",
      status: "To Do",
      due_date: "2026-02-21",
    };

    const task = mapTask(row);
    expect(task.clientId).toBeUndefined();
    expect(task.clientName).toBeUndefined();
    expect(task.deliverableId).toBeUndefined();
    expect(task.deliverableName).toBeUndefined();
    expect(task.notes).toBeUndefined();
  });
});

// ============================================
// toTaskRow
// ============================================
describe("toTaskRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toTaskRow({
      name: "Test task",
      assignedTo: "Robert",
      category: "Admin",
      status: "To Do",
      dueDate: "2026-02-21",
    });

    expect(row).toEqual({
      name: "Test task",
      assigned_to: "Robert",
      category: "Admin",
      status: "To Do",
      due_date: "2026-02-21",
    });
  });

  it("should convert empty clientId/deliverableId/notes to null", () => {
    const row = toTaskRow({ clientId: "", deliverableId: "", notes: "" });
    expect(row).toEqual({
      client_id: null,
      deliverable_id: null,
      notes: null,
    });
  });

  it("should preserve valid clientId", () => {
    const row = toTaskRow({ clientId: "c1" });
    expect(row).toEqual({ client_id: "c1" });
  });
});

// ============================================
// mapUserProfile
// ============================================
describe("mapUserProfile", () => {
  it("should convert DB row to UserProfile", () => {
    const row = {
      id: "user-uuid",
      email: "test@example.com",
      full_name: "Test User",
      role: "admin",
      avatar_url: "https://example.com/avatar.png",
      market: "SG",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-06-01T00:00:00Z",
    };

    const profile = mapUserProfile(row);

    expect(profile).toEqual({
      id: "user-uuid",
      email: "test@example.com",
      fullName: "Test User",
      role: "admin",
      avatarUrl: "https://example.com/avatar.png",
      market: "SG",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-06-01T00:00:00Z",
    });
  });

  it("should handle missing optional fields", () => {
    const row = {
      id: "1",
      email: "a@b.com",
      full_name: "A",
      role: "member",
    };

    const profile = mapUserProfile(row);
    expect(profile.avatarUrl).toBeUndefined();
    expect(profile.market).toBeUndefined();
  });
});

// ============================================
// mapContentItem
// ============================================
describe("mapContentItem", () => {
  it("should convert DB row to ContentItem", () => {
    const row = {
      id: "content-uuid",
      content_id: "CNT-001",
      client_id: "c1",
      client_name: "Acme",
      title: "Blog Post",
      content_type: "Blog",
      platform: "Website",
      status: "Draft",
      assigned_to: "Lina",
      due_date: "2026-02-28",
      publish_date: "2026-03-01",
      content_body: "Lorem ipsum",
      file_link: "https://drive.google.com/file",
      notes: "Review needed",
      market: "SG",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const content = mapContentItem(row);

    expect(content.id).toBe("content-uuid");
    expect(content.contentId).toBe("CNT-001");
    expect(content.clientId).toBe("c1");
    expect(content.clientName).toBe("Acme");
    expect(content.title).toBe("Blog Post");
    expect(content.contentType).toBe("Blog");
    expect(content.platform).toBe("Website");
    expect(content.status).toBe("Draft");
    expect(content.assignedTo).toBe("Lina");
    expect(content.dueDate).toBe("2026-02-28");
    expect(content.publishDate).toBe("2026-03-01");
    expect(content.contentBody).toBe("Lorem ipsum");
    expect(content.fileLink).toBe("https://drive.google.com/file");
    expect(content.notes).toBe("Review needed");
    expect(content.market).toBe("SG");
  });

  it("should handle missing optional fields", () => {
    const row = {
      id: "1",
      content_id: "CNT-X",
      title: "Test",
      content_type: "Video",
      status: "Ideation",
      assigned_to: "Robert",
      due_date: "2026-03-01",
      market: "US",
    };

    const content = mapContentItem(row);
    expect(content.clientId).toBeUndefined();
    expect(content.clientName).toBeUndefined();
    expect(content.platform).toBeUndefined();
    expect(content.publishDate).toBeUndefined();
    expect(content.contentBody).toBeUndefined();
    expect(content.fileLink).toBeUndefined();
    expect(content.notes).toBeUndefined();
  });
});

// ============================================
// toContentItemRow
// ============================================
describe("toContentItemRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toContentItemRow({
      title: "Blog Post",
      contentType: "Blog",
      status: "Draft",
      assignedTo: "Lina",
      dueDate: "2026-02-28",
      market: "SG",
    });

    expect(row).toEqual({
      title: "Blog Post",
      content_type: "Blog",
      status: "Draft",
      assigned_to: "Lina",
      due_date: "2026-02-28",
      market: "SG",
    });
  });

  it("should convert empty optional fields to null", () => {
    const row = toContentItemRow({
      clientId: "",
      platform: undefined,
      publishDate: "",
      contentBody: "",
      fileLink: "",
      notes: "",
    });

    expect(row).toEqual({
      client_id: null,
      publish_date: null,
      content_body: null,
      file_link: null,
      notes: null,
    });
  });
});

// ============================================
// mapGhlConnection
// ============================================
describe("mapGhlConnection", () => {
  it("should convert DB row to GhlConnection", () => {
    const row = {
      id: "ghl-uuid",
      client_id: "c1",
      client_name: "Acme",
      display_client_id: "OW-SG-001",
      market: "SG",
      api_key: "key-123",
      location_id: "loc-456",
      sync_enabled: true,
      last_sync_at: "2026-02-01T00:00:00Z",
      sync_status: "connected",
      contacts_synced: 42,
      pipelines_synced: 3,
      error_message: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const conn = mapGhlConnection(row);

    expect(conn.id).toBe("ghl-uuid");
    expect(conn.clientId).toBe("c1");
    expect(conn.clientName).toBe("Acme");
    expect(conn.displayClientId).toBe("OW-SG-001");
    expect(conn.market).toBe("SG");
    expect(conn.apiKey).toBe("key-123");
    expect(conn.locationId).toBe("loc-456");
    expect(conn.syncEnabled).toBe(true);
    expect(conn.lastSyncAt).toBe("2026-02-01T00:00:00Z");
    expect(conn.syncStatus).toBe("connected");
    expect(conn.contactsSynced).toBe(42);
    expect(conn.pipelinesSynced).toBe(3);
  });

  it("should default contactsSynced and pipelinesSynced to 0 when falsy", () => {
    const row = {
      id: "1",
      client_id: "c1",
      sync_enabled: false,
      sync_status: "disconnected",
      contacts_synced: null,
      pipelines_synced: undefined,
    };

    const conn = mapGhlConnection(row);
    expect(conn.contactsSynced).toBe(0);
    expect(conn.pipelinesSynced).toBe(0);
  });
});

// ============================================
// toGhlConnectionRow
// ============================================
describe("toGhlConnectionRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toGhlConnectionRow({
      clientId: "c1",
      apiKey: "key-123",
      locationId: "loc-456",
      syncEnabled: true,
      syncStatus: "connected",
    });

    expect(row).toEqual({
      client_id: "c1",
      api_key: "key-123",
      location_id: "loc-456",
      sync_enabled: true,
      sync_status: "connected",
    });
  });

  it("should convert empty apiKey and locationId to null", () => {
    const row = toGhlConnectionRow({ apiKey: "", locationId: "" });
    expect(row).toEqual({ api_key: null, location_id: null });
  });
});

// ============================================
// mapNotificationRule
// ============================================
describe("mapNotificationRule", () => {
  it("should convert DB row to NotificationRule", () => {
    const row = {
      id: "rule-uuid",
      name: "Overdue Alert",
      trigger_type: "overdue_deliverable",
      channel: "email",
      recipients: ["admin@example.com"],
      is_active: true,
      conditions: { daysOverdue: 3 },
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-15T00:00:00Z",
    };

    const rule = mapNotificationRule(row);

    expect(rule.id).toBe("rule-uuid");
    expect(rule.name).toBe("Overdue Alert");
    expect(rule.triggerType).toBe("overdue_deliverable");
    expect(rule.channel).toBe("email");
    expect(rule.recipients).toEqual(["admin@example.com"]);
    expect(rule.isActive).toBe(true);
    expect(rule.conditions).toEqual({ daysOverdue: 3 });
  });

  it("should default conditions to empty object when falsy", () => {
    const row = {
      id: "1",
      name: "Test",
      trigger_type: "status_change",
      channel: "in_app",
      recipients: [],
      is_active: false,
      conditions: null,
    };

    const rule = mapNotificationRule(row);
    expect(rule.conditions).toEqual({});
  });
});

// ============================================
// toNotificationRuleRow
// ============================================
describe("toNotificationRuleRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toNotificationRuleRow({
      name: "Test Rule",
      triggerType: "overdue_invoice",
      channel: "both",
      recipients: ["user@example.com"],
      isActive: true,
      conditions: { priority: "High" },
    });

    expect(row).toEqual({
      name: "Test Rule",
      trigger_type: "overdue_invoice",
      channel: "both",
      recipients: ["user@example.com"],
      is_active: true,
      conditions: { priority: "High" },
    });
  });
});

// ============================================
// mapNotification
// ============================================
describe("mapNotification", () => {
  it("should convert DB row to Notification", () => {
    const row = {
      id: "notif-uuid",
      user_email: "user@example.com",
      title: "Task Overdue",
      message: "Task TSK-001 is overdue",
      type: "warning",
      is_read: false,
      link: "/tasks/TSK-001",
      created_at: "2026-02-01T00:00:00Z",
    };

    const notif = mapNotification(row);

    expect(notif.id).toBe("notif-uuid");
    expect(notif.userEmail).toBe("user@example.com");
    expect(notif.title).toBe("Task Overdue");
    expect(notif.message).toBe("Task TSK-001 is overdue");
    expect(notif.type).toBe("warning");
    expect(notif.isRead).toBe(false);
    expect(notif.link).toBe("/tasks/TSK-001");
    expect(notif.createdAt).toBe("2026-02-01T00:00:00Z");
  });

  it("should handle missing optional link", () => {
    const row = {
      id: "1",
      user_email: "a@b.com",
      title: "Info",
      message: "Just FYI",
      type: "info",
      is_read: true,
    };

    const notif = mapNotification(row);
    expect(notif.link).toBeUndefined();
    expect(notif.createdAt).toBeUndefined();
  });
});

// ============================================
// mapPortalAccess
// ============================================
describe("mapPortalAccess", () => {
  it("should convert DB row to PortalAccess", () => {
    const row = {
      id: "portal-uuid",
      client_id: "c1",
      access_token: "abc123def456",
      contact_email: "client@example.com",
      contact_name: "Client Contact",
      is_active: true,
      last_accessed_at: "2026-02-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
    };

    const access = mapPortalAccess(row);

    expect(access.id).toBe("portal-uuid");
    expect(access.clientId).toBe("c1");
    expect(access.accessToken).toBe("abc123def456");
    expect(access.contactEmail).toBe("client@example.com");
    expect(access.contactName).toBe("Client Contact");
    expect(access.isActive).toBe(true);
    expect(access.lastAccessedAt).toBe("2026-02-01T00:00:00Z");
    expect(access.createdAt).toBe("2026-01-01T00:00:00Z");
  });

  it("should handle missing optional fields", () => {
    const row = {
      id: "1",
      client_id: "c1",
      access_token: "token",
      contact_email: "a@b.com",
      contact_name: "A",
      is_active: false,
    };

    const access = mapPortalAccess(row);
    expect(access.lastAccessedAt).toBeUndefined();
    expect(access.createdAt).toBeUndefined();
  });
});

// ============================================
// toPortalAccessRow
// ============================================
describe("toPortalAccessRow", () => {
  it("should convert camelCase to snake_case", () => {
    const row = toPortalAccessRow({
      clientId: "c1",
      accessToken: "token123",
      contactEmail: "client@example.com",
      contactName: "John",
      isActive: true,
    });

    expect(row).toEqual({
      client_id: "c1",
      access_token: "token123",
      contact_email: "client@example.com",
      contact_name: "John",
      is_active: true,
    });
  });

  it("should only include defined fields", () => {
    const row = toPortalAccessRow({ isActive: false });
    expect(row).toEqual({ is_active: false });
    expect(Object.keys(row)).toHaveLength(1);
  });
});
