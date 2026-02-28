import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Users,
  FileCheck,
  UsersRound,
  Globe,
  Settings,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useTeamMembers } from "@/hooks/use-team";
import { usePortalAccessList } from "@/hooks/use-portal";

interface ChecklistStep {
  key: string;
  label: string;
  description: string;
  icon: typeof Users;
  path: string;
  linkLabel: string;
}

const STEPS: ChecklistStep[] = [
  {
    key: "client_added",
    label: "Add your first client",
    description: "Bring your first client into Onnify to start managing their work.",
    icon: Users,
    path: "/clients",
    linkLabel: "Go to Clients →",
  },
  {
    key: "deliverable_created",
    label: "Create a deliverable",
    description: "Track what you're delivering — SEO, content, ads, and more.",
    icon: FileCheck,
    path: "/deliverables",
    linkLabel: "Go to Deliverables →",
  },
  {
    key: "team_setup",
    label: "Set up your team",
    description: "Add your team members so you can assign tasks and deliverables.",
    icon: UsersRound,
    path: "/team",
    linkLabel: "Go to Team →",
  },
  {
    key: "portal_granted",
    label: "Grant a client portal",
    description: "Give clients a secure portal to see progress and communicate.",
    icon: Globe,
    path: "/portal-admin",
    linkLabel: "Go to Client Portal →",
  },
  {
    key: "branding_set",
    label: "Customize your branding",
    description: "Set your agency name, logo, and portal colors.",
    icon: Settings,
    path: "/settings",
    linkLabel: "Go to Settings →",
  },
];

export function OnboardingChecklist({ onDismiss }: { onDismiss: () => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const { data: clients = [] } = useClients();
  const { data: deliverables = [] } = useDeliverables();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: portals = [] } = usePortalAccessList();

  const completedKeys = new Set<string>();
  if (clients.length > 0) completedKeys.add("client_added");
  if (deliverables.length > 0) completedKeys.add("deliverable_created");
  if (teamMembers.length > 0) completedKeys.add("team_setup");
  if (portals.length > 0) completedKeys.add("portal_granted");

  const completedCount = completedKeys.size;
  const total = STEPS.length;
  const allDone = completedCount >= total;
  const pct = Math.round((completedCount / total) * 100);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Progress ring */}
            <div className="relative h-10 w-10 shrink-0">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-primary/20"
                />
                <circle
                  cx="18" cy="18" r="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                  className="text-primary transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                {completedCount}/{total}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Getting Started</h3>
              <p className="text-xs text-muted-foreground">{allDone ? "All done! You're all set." : `${total - completedCount} step${total - completedCount !== 1 ? "s" : ""} remaining`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="p-4 pt-3">
          <div className="space-y-1">
            {STEPS.map((step) => {
              const done = completedKeys.has(step.key);
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className={cn(
                    "flex items-start gap-3 p-2.5 rounded-lg transition-colors",
                    done ? "opacity-50" : "hover:bg-primary/5"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-primary/40 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                        {step.label}
                      </p>
                    </div>
                    {!done && (
                      <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                    )}
                  </div>
                  {!done && (
                    <Link to={step.path} className="shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary px-2">
                        {step.linkLabel}
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
