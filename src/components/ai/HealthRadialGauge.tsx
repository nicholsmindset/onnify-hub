import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import { getScoreColor } from "@/lib/health-score";

interface HealthRadialGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export function HealthRadialGauge({ score, size = 120, label }: HealthRadialGaugeProps) {
  const data = [
    { name: "score", value: score, fill: getChartFill(score) },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            background={{ fill: "hsl(var(--muted))" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold font-mono ${getScoreColor(score)}`}>
          {score}
        </span>
        {label && (
          <span className="text-[10px] text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}

function getChartFill(score: number): string {
  if (score >= 90) return "hsl(142, 71%, 45%)";
  if (score >= 75) return "hsl(160, 60%, 45%)";
  if (score >= 60) return "hsl(48, 96%, 53%)";
  if (score >= 40) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}
