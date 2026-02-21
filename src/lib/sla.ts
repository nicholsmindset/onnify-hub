import { SlaDefinition } from "@/types";

export type SlaStatus = "on_track" | "warning" | "critical" | "breached";

export function calculateSlaDeadline(
  contentType: string,
  createdAt: string,
  slaDefinitions: SlaDefinition[]
): string | null {
  const sla = slaDefinitions.find((s) => s.contentType === contentType);
  if (!sla) return null;

  const created = new Date(createdAt);
  let businessDays = sla.totalDays;
  const deadline = new Date(created);

  while (businessDays > 0) {
    deadline.setDate(deadline.getDate() + 1);
    const day = deadline.getDay();
    if (day !== 0 && day !== 6) {
      businessDays--;
    }
  }

  return deadline.toISOString().split("T")[0];
}

export function getSlaStatus(deadline: string | undefined | null): SlaStatus {
  if (!deadline) return "on_track";

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return "breached";
  if (hoursRemaining <= 24) return "critical";
  if (hoursRemaining <= 48) return "warning";
  return "on_track";
}

export function getDaysRemaining(deadline: string | undefined | null): number {
  if (!deadline) return Infinity;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSlaStatusColor(status: SlaStatus): string {
  switch (status) {
    case "on_track": return "bg-success/10 text-success";
    case "warning": return "bg-warning/10 text-warning";
    case "critical": return "bg-destructive/10 text-destructive";
    case "breached": return "bg-destructive text-destructive-foreground";
  }
}

export function getSlaStatusLabel(status: SlaStatus): string {
  switch (status) {
    case "on_track": return "On Track";
    case "warning": return "Due Soon";
    case "critical": return "Urgent";
    case "breached": return "Overdue";
  }
}
