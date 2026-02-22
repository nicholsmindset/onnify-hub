import { Client, Deliverable, Invoice, Task } from "@/types";

export interface ClientHealthScore {
  clientId: string;
  companyName: string;
  market: string;
  monthlyValue: number;
  planTier: string;
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  trend: "improving" | "stable" | "declining";
  factors: HealthFactor[];
}

export interface HealthFactor {
  name: string;
  score: number; // 0-100
  weight: number;
  detail: string;
}

const GRADE_THRESHOLDS: [number, ClientHealthScore["grade"]][] = [
  [90, "A"],
  [75, "B"],
  [60, "C"],
  [40, "D"],
  [0, "F"],
];

function getGrade(score: number): ClientHealthScore["grade"] {
  for (const [threshold, grade] of GRADE_THRESHOLDS) {
    if (score >= threshold) return grade;
  }
  return "F";
}

export function calculateHealthScore(
  client: Client,
  deliverables: Deliverable[],
  invoices: Invoice[],
  tasks: Task[]
): ClientHealthScore {
  const now = new Date();
  const clientDeliverables = deliverables.filter((d) => d.clientId === client.id);
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const clientTasks = tasks.filter((t) => t.clientId === client.id);

  const factors: HealthFactor[] = [];

  // 1. Deliverable Completion Rate (weight: 30%)
  const totalDeliverables = clientDeliverables.length;
  const completedDeliverables = clientDeliverables.filter(
    (d) => d.status === "Delivered" || d.status === "Approved"
  ).length;
  const delivCompletionRate = totalDeliverables > 0
    ? (completedDeliverables / totalDeliverables) * 100
    : 100; // No deliverables = no issues
  factors.push({
    name: "Delivery Rate",
    score: Math.round(delivCompletionRate),
    weight: 0.3,
    detail: `${completedDeliverables}/${totalDeliverables} completed`,
  });

  // 2. Overdue Items (weight: 25%)
  const overdueDeliverables = clientDeliverables.filter(
    (d) => new Date(d.dueDate) < now && d.status !== "Delivered" && d.status !== "Approved"
  );
  const overdueTasks = clientTasks.filter(
    (t) => new Date(t.dueDate) < now && t.status !== "Done"
  );
  const overdueCount = overdueDeliverables.length + overdueTasks.length;
  const overdueScore = Math.max(0, 100 - overdueCount * 25); // -25 per overdue item
  factors.push({
    name: "On-Time Delivery",
    score: overdueScore,
    weight: 0.25,
    detail: `${overdueCount} overdue item${overdueCount !== 1 ? "s" : ""}`,
  });

  // 3. Invoice Payment Health (weight: 25%)
  const totalInvoices = clientInvoices.length;
  const paidInvoices = clientInvoices.filter((i) => i.status === "Paid").length;
  const overdueInvoices = clientInvoices.filter((i) => i.status === "Overdue").length;
  let invoiceScore = totalInvoices > 0
    ? ((paidInvoices / totalInvoices) * 100) - (overdueInvoices * 20)
    : 100;
  invoiceScore = Math.max(0, Math.min(100, invoiceScore));
  factors.push({
    name: "Payment Health",
    score: Math.round(invoiceScore),
    weight: 0.25,
    detail: `${paidInvoices} paid, ${overdueInvoices} overdue of ${totalInvoices}`,
  });

  // 4. Engagement Recency (weight: 20%)
  const recentDeliverables = clientDeliverables.filter((d) => {
    const updated = new Date(d.updatedAt || d.createdAt || "");
    const daysSince = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 14;
  });
  const recentTasks = clientTasks.filter((t) => {
    const updated = new Date(t.updatedAt || t.createdAt || "");
    const daysSince = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < 14;
  });
  const hasRecentActivity = recentDeliverables.length > 0 || recentTasks.length > 0;
  const engagementScore = hasRecentActivity ? 100 : (totalDeliverables === 0 && clientTasks.length === 0 ? 70 : 40);
  factors.push({
    name: "Engagement",
    score: engagementScore,
    weight: 0.2,
    detail: hasRecentActivity
      ? `${recentDeliverables.length + recentTasks.length} items updated recently`
      : "No recent activity",
  });

  // Calculate weighted score
  const score = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  // Determine trend based on overdue trajectory
  let trend: ClientHealthScore["trend"] = "stable";
  if (overdueCount > 2 || overdueInvoices > 0) {
    trend = "declining";
  } else if (delivCompletionRate > 80 && overdueCount === 0 && invoiceScore > 80) {
    trend = "improving";
  }

  return {
    clientId: client.id,
    companyName: client.companyName,
    market: client.market,
    monthlyValue: client.monthlyValue,
    planTier: client.planTier,
    score,
    grade: getGrade(score),
    trend,
    factors,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 90) return "bg-green-500/10";
  if (score >= 75) return "bg-emerald-500/10";
  if (score >= 60) return "bg-yellow-500/10";
  if (score >= 40) return "bg-orange-500/10";
  return "bg-red-500/10";
}

export function getGradeColor(grade: ClientHealthScore["grade"]): string {
  switch (grade) {
    case "A": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "B": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "C": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "D": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "F": return "bg-red-500/10 text-red-500 border-red-500/20";
  }
}

export function getTrendIcon(trend: ClientHealthScore["trend"]): string {
  switch (trend) {
    case "improving": return "↑";
    case "stable": return "→";
    case "declining": return "↓";
  }
}

export function getTrendColor(trend: ClientHealthScore["trend"]): string {
  switch (trend) {
    case "improving": return "text-green-500";
    case "stable": return "text-muted-foreground";
    case "declining": return "text-red-500";
  }
}
