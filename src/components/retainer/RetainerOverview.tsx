import { useRetainerUsage, useRetainerTiers } from "@/hooks/use-retainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RetainerUsageMeter } from "@/components/retainer/RetainerUsageMeter";

interface RetainerOverviewProps {
  clientId: string;
  planTier: string;
}

export function RetainerOverview({ clientId, planTier }: RetainerOverviewProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: usage, isLoading: loadingUsage } = useRetainerUsage(clientId, currentMonth);
  const { data: tiers = [], isLoading: loadingTiers } = useRetainerTiers();

  const tier = tiers.find((t) => t.name === planTier);

  if (loadingUsage || loadingTiers) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
        </CardContent>
      </Card>
    );
  }

  if (!tier) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Retainer Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No retainer tier found for &ldquo;{planTier}&rdquo;.
          </p>
        </CardContent>
      </Card>
    );
  }

  const deliverables = [
    { label: "Blogs", used: usage?.blogsUsed ?? 0, total: tier.blogsPerMonth },
    { label: "Service Pages", used: usage?.servicePagesUsed ?? 0, total: tier.servicePagesPerMonth },
    { label: "pSEO Pages", used: usage?.pseoPagesUsed ?? 0, total: tier.pseoPagesPerMonth },
    { label: "Social Cascades", used: usage?.socialCascadesUsed ?? 0, total: tier.socialCascadesPerMonth },
    { label: "Email Sequences", used: usage?.emailSequencesUsed ?? 0, total: tier.emailSequencesPerMonth },
    { label: "Case Studies", used: usage?.caseStudiesUsed ?? 0, total: tier.caseStudiesPerMonth },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Retainer Usage</CardTitle>
          <span className="text-sm text-muted-foreground">{currentMonth}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {planTier} tier &mdash; monthly deliverable allocation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliverables.map((d) => (
          <RetainerUsageMeter
            key={d.label}
            label={d.label}
            used={d.used}
            total={d.total}
          />
        ))}
      </CardContent>
    </Card>
  );
}
