import { Link } from "react-router-dom";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle } from "lucide-react";
import { OnboardingStep } from "@/types";

interface OnboardingChecklistProps {
  clientId: string;
}

const STEPS: { key: OnboardingStep; label: string }[] = [
  { key: "intake_pending", label: "Intake Form" },
  { key: "intake_completed", label: "Intake Completed" },
  { key: "brand_review", label: "Brand Review" },
  { key: "first_content", label: "First Content" },
  { key: "client_review", label: "Client Review" },
  { key: "complete", label: "Complete" },
];

function getStepIndex(status: OnboardingStep): number {
  return STEPS.findIndex((s) => s.key === status);
}

const statusBadgeColor: Record<string, string> = {
  intake_pending: "bg-warning/10 text-warning",
  intake_completed: "bg-primary/10 text-primary",
  brand_review: "bg-primary/10 text-primary",
  first_content: "bg-primary/10 text-primary",
  client_review: "bg-warning/10 text-warning",
  complete: "bg-success/10 text-success",
};

export function OnboardingChecklist({ clientId }: OnboardingChecklistProps) {
  const { data: onboarding, isLoading } = useOnboarding(clientId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
        </CardContent>
      </Card>
    );
  }

  if (!onboarding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Not Started</p>
          <Link to={`/clients/${clientId}/onboarding`}>
            <Button size="sm">Start Onboarding</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = getStepIndex(onboarding.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Onboarding</CardTitle>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeColor[onboarding.status] || "bg-muted text-muted-foreground"}`}
          >
            {STEPS[currentIndex]?.label ?? onboarding.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <Circle
                  className={`h-4 w-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                />
              )}
              <span
                className={`text-sm ${
                  isCompleted
                    ? "text-muted-foreground line-through"
                    : isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {isCurrent && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  Current
                </Badge>
              )}
            </div>
          );
        })}

        <div className="pt-2">
          <Link to={`/clients/${clientId}/onboarding`}>
            <Button size="sm" variant={onboarding.status === "complete" ? "outline" : "default"}>
              {onboarding.status === "complete"
                ? "View Onboarding"
                : "Continue Onboarding"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
