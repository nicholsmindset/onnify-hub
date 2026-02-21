import { getSlaStatus, getSlaStatusColor, getSlaStatusLabel, getDaysRemaining } from "@/lib/sla";
import { Badge } from "@/components/ui/badge";

interface SlaIndicatorProps {
  deadline?: string | null;
}

export function SlaIndicator({ deadline }: SlaIndicatorProps) {
  if (!deadline) {
    return (
      <Badge variant="secondary" className="text-xs">
        No SLA
      </Badge>
    );
  }

  const status = getSlaStatus(deadline);
  const colorClass = getSlaStatusColor(status);
  const label = getSlaStatusLabel(status);
  const daysRemaining = getDaysRemaining(deadline);

  const daysText =
    daysRemaining <= 0
      ? `${Math.abs(daysRemaining)}d overdue`
      : daysRemaining === 1
        ? "1 day left"
        : `${daysRemaining}d left`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label} &middot; {daysText}
    </span>
  );
}
