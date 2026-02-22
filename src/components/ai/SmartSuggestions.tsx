import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, X, Plus, AlertTriangle, DollarSign, Clock, FileCheck } from "lucide-react";
import { Client, Deliverable, Invoice, Task, ContentItem } from "@/types";
import { useCreateTask } from "@/hooks/use-tasks";

interface Suggestion {
  id: string;
  icon: "overdue" | "invoice" | "deadline" | "deliverable";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  taskData?: {
    name: string;
    clientId?: string;
    assignedTo: string;
    category: string;
    dueDate: string;
  };
}

interface SmartSuggestionsProps {
  clients: Client[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  tasks: Task[];
  content: ContentItem[];
}

const priorityColor = {
  high: "bg-red-500/10 text-red-600 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const iconMap = {
  overdue: AlertTriangle,
  invoice: DollarSign,
  deadline: Clock,
  deliverable: FileCheck,
};

export function SmartSuggestions({ clients, deliverables, invoices, tasks, content }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [created, setCreated] = useState<Set<string>>(new Set());
  const createTask = useCreateTask();

  const suggestions = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const items: Suggestion[] = [];

    // 1. Overdue deliverables with no follow-up task
    const overdueDeliverables = deliverables.filter(
      (d) => new Date(d.dueDate) < now && d.status !== "Delivered" && d.status !== "Approved"
    );
    for (const d of overdueDeliverables) {
      const hasFollowUp = tasks.some(
        (t) => t.deliverableId === d.id && t.status !== "Done"
      );
      if (!hasFollowUp) {
        items.push({
          id: `overdue-${d.id}`,
          icon: "overdue",
          priority: "high",
          title: `"${d.name}" is overdue`,
          description: `Due ${d.dueDate} for ${d.clientName || "unknown client"} — still ${d.status}. No follow-up task exists.`,
          action: "Create Follow-up Task",
          taskData: {
            name: `Follow up: ${d.name} (overdue)`,
            clientId: d.clientId,
            assignedTo: d.assignedTo,
            category: "Ops",
            dueDate: new Date(now.getTime() + 86400000).toISOString().split("T")[0],
          },
        });
      }
    }

    // 2. Overdue invoices — create payment follow-up
    const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
    for (const inv of overdueInvoices) {
      const client = clients.find((c) => c.id === inv.clientId);
      const hasFollowUp = tasks.some(
        (t) => t.notes?.includes(inv.invoiceId) && t.status !== "Done"
      );
      if (!hasFollowUp) {
        items.push({
          id: `invoice-${inv.id}`,
          icon: "invoice",
          priority: "high",
          title: `Invoice ${inv.invoiceId} is overdue ($${inv.amount.toLocaleString()})`,
          description: `${client?.companyName || "Client"} hasn't paid. Send a payment reminder.`,
          action: "Create Payment Follow-up",
          taskData: {
            name: `Payment follow-up: ${inv.invoiceId} ($${inv.amount})`,
            clientId: inv.clientId,
            assignedTo: "Robert",
            category: "Sales",
            dueDate: new Date(now.getTime() + 86400000).toISOString().split("T")[0],
          },
        });
      }
    }

    // 3. Deliverables due soon but still "Not Started"
    const dueSoonNotStarted = deliverables.filter((d) => {
      const due = new Date(d.dueDate);
      return due >= now && due <= threeDaysFromNow && d.status === "Not Started";
    });
    for (const d of dueSoonNotStarted) {
      items.push({
        id: `deadline-${d.id}`,
        icon: "deadline",
        priority: "medium",
        title: `"${d.name}" due in ${Math.ceil((new Date(d.dueDate).getTime() - now.getTime()) / 86400000)} days but Not Started`,
        description: `Assigned to ${d.assignedTo} for ${d.clientName || "unknown client"}. Consider creating a task to kick this off.`,
        action: "Create Start Task",
        taskData: {
          name: `Start work on: ${d.name}`,
          clientId: d.clientId,
          assignedTo: d.assignedTo,
          category: "Ops",
          dueDate: new Date().toISOString().split("T")[0],
        },
      });
    }

    // 4. Content items stuck in "Ideation" for a while
    const stuckContent = content.filter((c) => {
      if (c.status !== "Ideation") return false;
      const created = new Date(c.createdAt || "");
      const daysSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    });
    for (const c of stuckContent.slice(0, 2)) {
      items.push({
        id: `content-${c.id}`,
        icon: "deliverable",
        priority: "low",
        title: `Content "${c.title}" stuck in Ideation`,
        description: `Created over a week ago. Assigned to ${c.assignedTo}. Consider moving to Draft.`,
        action: "Create Draft Task",
        taskData: {
          name: `Draft content: ${c.title}`,
          clientId: c.clientId || undefined,
          assignedTo: c.assignedTo,
          category: "Content",
          dueDate: new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0],
        },
      });
    }

    return items.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }, [clients, deliverables, invoices, tasks, content]);

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (visible.length === 0) return null;

  const handleCreate = (suggestion: Suggestion) => {
    if (!suggestion.taskData) return;
    createTask.mutate(
      {
        ...suggestion.taskData,
        taskId: "TSK-TMP",
        status: "To Do",
      } as Parameters<typeof createTask.mutate>[0],
      {
        onSuccess: () => setCreated((prev) => new Set(prev).add(suggestion.id)),
      }
    );
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" /> Smart Suggestions
        </CardTitle>
        <Badge variant="secondary" className="text-xs">{visible.length}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visible.slice(0, 4).map((s) => {
            const Icon = iconMap[s.icon];
            const isCreated = created.has(s.id);
            return (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${s.priority === "high" ? "text-red-500" : s.priority === "medium" ? "text-yellow-500" : "text-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{s.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${priorityColor[s.priority]}`}>
                      {s.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isCreated ? (
                    <Badge variant="secondary" className="text-xs">Created</Badge>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={createTask.isPending}
                      onClick={() => handleCreate(s)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> {s.action}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDismissed((prev) => new Set(prev).add(s.id))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
          {visible.length > 4 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{visible.length - 4} more suggestion{visible.length - 4 !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
