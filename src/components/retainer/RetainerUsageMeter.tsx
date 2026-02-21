import { Progress } from "@/components/ui/progress";

interface RetainerUsageMeterProps {
  label: string;
  used: number;
  total: number;
}

export function RetainerUsageMeter({ label, used, total }: RetainerUsageMeterProps) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  const colorClass =
    percentage > 90
      ? "[&>div]:bg-destructive"
      : percentage >= 75
        ? "[&>div]:bg-warning"
        : "[&>div]:bg-success";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {used} of {total}
        </span>
      </div>
      <Progress value={percentage} className={`h-2 ${colorClass}`} />
    </div>
  );
}
