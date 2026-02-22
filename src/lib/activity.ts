import { Deliverable, Invoice, Task, ContentItem } from "@/types";

export interface ActivityItem {
  id: string;
  type: "deliverable" | "invoice" | "task" | "content";
  action: string;
  title: string;
  subtitle?: string;
  timestamp: string;
}

export function buildActivityFeed(
  deliverables: Deliverable[],
  invoices: Invoice[],
  tasks: Task[],
  content: ContentItem[],
  limit = 10
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const d of deliverables) {
    const ts = d.updatedAt || d.createdAt || "";
    if (!ts) continue;
    items.push({
      id: `d-${d.id}`,
      type: "deliverable",
      action: d.status === "Delivered" ? "Delivered" : d.status === "Approved" ? "Approved" : "Updated",
      title: d.name,
      subtitle: d.clientName || undefined,
      timestamp: ts,
    });
  }

  for (const i of invoices) {
    const ts = i.updatedAt || i.createdAt || "";
    if (!ts) continue;
    items.push({
      id: `i-${i.id}`,
      type: "invoice",
      action: i.status === "Paid" ? "Paid" : i.status === "Sent" ? "Sent" : "Updated",
      title: `${i.invoiceId} - $${i.amount.toLocaleString()}`,
      subtitle: i.clientName || undefined,
      timestamp: ts,
    });
  }

  for (const t of tasks) {
    const ts = t.updatedAt || t.createdAt || "";
    if (!ts) continue;
    items.push({
      id: `t-${t.id}`,
      type: "task",
      action: t.status === "Done" ? "Completed" : "Updated",
      title: t.name,
      subtitle: t.assignedTo,
      timestamp: ts,
    });
  }

  for (const c of content) {
    const ts = c.updatedAt || c.createdAt || "";
    if (!ts) continue;
    items.push({
      id: `c-${c.id}`,
      type: "content",
      action: c.status === "Published" ? "Published" : c.status === "Approved" ? "Approved" : "Updated",
      title: c.title,
      subtitle: c.clientName || c.platform || undefined,
      timestamp: ts,
    });
  }

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function getActivityIcon(type: ActivityItem["type"]): string {
  switch (type) {
    case "deliverable": return "FileCheck";
    case "invoice": return "Receipt";
    case "task": return "ListTodo";
    case "content": return "FileText";
  }
}

export function timeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
