import { describe, it, expect } from "vitest";
import { mockClients, mockDeliverables, mockInvoices, mockTasks } from "@/data/mock-data";

describe("mockClients", () => {
  it("should have 6 clients", () => {
    expect(mockClients).toHaveLength(6);
  });

  it("should have unique IDs", () => {
    const ids = mockClients.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique clientIds", () => {
    const clientIds = mockClients.map((c) => c.clientId);
    expect(new Set(clientIds).size).toBe(clientIds.length);
  });

  it("should follow OW-XX-NNN format for clientId", () => {
    const pattern = /^OW-(SG|ID|US)-\d{3}$/;
    for (const client of mockClients) {
      expect(client.clientId).toMatch(pattern);
    }
  });

  it("should have valid market values", () => {
    const validMarkets = ["SG", "ID", "US"];
    for (const client of mockClients) {
      expect(validMarkets).toContain(client.market);
    }
  });

  it("should have valid status values", () => {
    const validStatuses = ["Prospect", "Onboarding", "Active", "Churned"];
    for (const client of mockClients) {
      expect(validStatuses).toContain(client.status);
    }
  });

  it("should have valid planTier values", () => {
    const validTiers = ["Starter", "Growth", "Pro"];
    for (const client of mockClients) {
      expect(validTiers).toContain(client.planTier);
    }
  });

  it("should have positive or zero monthlyValue", () => {
    for (const client of mockClients) {
      expect(client.monthlyValue).toBeGreaterThanOrEqual(0);
    }
  });

  it("should have non-empty companyName", () => {
    for (const client of mockClients) {
      expect(client.companyName.length).toBeGreaterThan(0);
    }
  });

  it("should have non-empty primaryContact", () => {
    for (const client of mockClients) {
      expect(client.primaryContact.length).toBeGreaterThan(0);
    }
  });

  it("should include clients from multiple markets", () => {
    const markets = new Set(mockClients.map((c) => c.market));
    expect(markets.size).toBeGreaterThanOrEqual(2);
  });

  it("should include clients with different statuses", () => {
    const statuses = new Set(mockClients.map((c) => c.status));
    expect(statuses.size).toBeGreaterThanOrEqual(3);
  });
});

describe("mockDeliverables", () => {
  it("should have 6 deliverables", () => {
    expect(mockDeliverables).toHaveLength(6);
  });

  it("should have unique IDs", () => {
    const ids = mockDeliverables.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique deliverableIds", () => {
    const deliverableIds = mockDeliverables.map((d) => d.deliverableId);
    expect(new Set(deliverableIds).size).toBe(deliverableIds.length);
  });

  it("should follow DEL-NNN format for deliverableId", () => {
    const pattern = /^DEL-\d{3}$/;
    for (const del of mockDeliverables) {
      expect(del.deliverableId).toMatch(pattern);
    }
  });

  it("should reference valid client IDs", () => {
    const clientIds = new Set(mockClients.map((c) => c.id));
    for (const del of mockDeliverables) {
      expect(clientIds.has(del.clientId)).toBe(true);
    }
  });

  it("should have valid service types", () => {
    const validTypes = ["SEO", "Voice AI", "CRM", "Paid Media", "Content", "Automation", "Strategy"];
    for (const del of mockDeliverables) {
      expect(validTypes).toContain(del.serviceType);
    }
  });

  it("should have valid priority values", () => {
    const validPriorities = ["High", "Medium", "Low"];
    for (const del of mockDeliverables) {
      expect(validPriorities).toContain(del.priority);
    }
  });

  it("should have valid status values", () => {
    const validStatuses = ["Not Started", "In Progress", "Review", "Delivered", "Approved"];
    for (const del of mockDeliverables) {
      expect(validStatuses).toContain(del.status);
    }
  });

  it("should have valid market values", () => {
    const validMarkets = ["SG", "ID", "US"];
    for (const del of mockDeliverables) {
      expect(validMarkets).toContain(del.market);
    }
  });

  it("should have non-empty name", () => {
    for (const del of mockDeliverables) {
      expect(del.name.length).toBeGreaterThan(0);
    }
  });

  it("should have non-empty assignedTo", () => {
    for (const del of mockDeliverables) {
      expect(del.assignedTo.length).toBeGreaterThan(0);
    }
  });

  it("should have boolean clientApproved", () => {
    for (const del of mockDeliverables) {
      expect(typeof del.clientApproved).toBe("boolean");
    }
  });
});

describe("mockInvoices", () => {
  it("should have 5 invoices", () => {
    expect(mockInvoices).toHaveLength(5);
  });

  it("should have unique IDs", () => {
    const ids = mockInvoices.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique invoiceIds", () => {
    const invoiceIds = mockInvoices.map((i) => i.invoiceId);
    expect(new Set(invoiceIds).size).toBe(invoiceIds.length);
  });

  it("should follow INV-YYYY-NNN format for invoiceId", () => {
    const pattern = /^INV-\d{4}-\d{3}$/;
    for (const inv of mockInvoices) {
      expect(inv.invoiceId).toMatch(pattern);
    }
  });

  it("should reference valid client IDs", () => {
    const clientIds = new Set(mockClients.map((c) => c.id));
    for (const inv of mockInvoices) {
      expect(clientIds.has(inv.clientId)).toBe(true);
    }
  });

  it("should have valid currency values", () => {
    const validCurrencies = ["SGD", "USD", "IDR"];
    for (const inv of mockInvoices) {
      expect(validCurrencies).toContain(inv.currency);
    }
  });

  it("should have valid status values", () => {
    const validStatuses = ["Draft", "Sent", "Paid", "Overdue"];
    for (const inv of mockInvoices) {
      expect(validStatuses).toContain(inv.status);
    }
  });

  it("should have positive amounts", () => {
    for (const inv of mockInvoices) {
      expect(inv.amount).toBeGreaterThan(0);
    }
  });

  it("should have non-empty servicesBilled", () => {
    for (const inv of mockInvoices) {
      expect(inv.servicesBilled.length).toBeGreaterThan(0);
    }
  });

  it("should have paymentDate only for Paid invoices (if set)", () => {
    for (const inv of mockInvoices) {
      if (inv.paymentDate) {
        expect(inv.status).toBe("Paid");
      }
    }
  });
});

describe("mockTasks", () => {
  it("should have 6 tasks", () => {
    expect(mockTasks).toHaveLength(6);
  });

  it("should have unique IDs", () => {
    const ids = mockTasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have unique taskIds", () => {
    const taskIds = mockTasks.map((t) => t.taskId);
    expect(new Set(taskIds).size).toBe(taskIds.length);
  });

  it("should follow TSK-NNN format for taskId", () => {
    const pattern = /^TSK-\d{3}$/;
    for (const task of mockTasks) {
      expect(task.taskId).toMatch(pattern);
    }
  });

  it("should have valid category values", () => {
    const validCategories = ["Admin", "Strategy", "Content", "Tech", "Sales", "Ops"];
    for (const task of mockTasks) {
      expect(validCategories).toContain(task.category);
    }
  });

  it("should have valid status values", () => {
    const validStatuses = ["To Do", "In Progress", "Done", "Blocked"];
    for (const task of mockTasks) {
      expect(validStatuses).toContain(task.status);
    }
  });

  it("should have non-empty name", () => {
    for (const task of mockTasks) {
      expect(task.name.length).toBeGreaterThan(0);
    }
  });

  it("should have non-empty assignedTo", () => {
    for (const task of mockTasks) {
      expect(task.assignedTo.length).toBeGreaterThan(0);
    }
  });

  it("should reference valid client IDs when clientId is set", () => {
    const clientIds = new Set(mockClients.map((c) => c.id));
    for (const task of mockTasks) {
      if (task.clientId) {
        expect(clientIds.has(task.clientId)).toBe(true);
      }
    }
  });

  it("should include tasks with and without client associations", () => {
    const withClient = mockTasks.filter((t) => t.clientId);
    const withoutClient = mockTasks.filter((t) => !t.clientId);
    expect(withClient.length).toBeGreaterThan(0);
    expect(withoutClient.length).toBeGreaterThan(0);
  });

  it("should include tasks with different statuses", () => {
    const statuses = new Set(mockTasks.map((t) => t.status));
    expect(statuses.size).toBeGreaterThanOrEqual(3);
  });
});
