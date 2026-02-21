import { useState } from "react";
import { useRetainerTiers, useUpdateRetainerTier } from "@/hooks/use-retainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { RetainerTier } from "@/types";

interface EditableTier {
  blogsPerMonth: number;
  servicePagesPerMonth: number;
  pseoPagesPerMonth: number;
  socialCascadesPerMonth: number;
  emailSequencesPerMonth: number;
  caseStudiesPerMonth: number;
  revisionsPerPiece: number;
  contentRequestsPerMonth: number;
}

const FIELDS: { key: keyof EditableTier; label: string }[] = [
  { key: "blogsPerMonth", label: "Blogs / Month" },
  { key: "servicePagesPerMonth", label: "Service Pages / Month" },
  { key: "pseoPagesPerMonth", label: "pSEO Pages / Month" },
  { key: "socialCascadesPerMonth", label: "Social Cascades / Month" },
  { key: "emailSequencesPerMonth", label: "Email Sequences / Month" },
  { key: "caseStudiesPerMonth", label: "Case Studies / Month" },
  { key: "revisionsPerPiece", label: "Revisions / Piece" },
  { key: "contentRequestsPerMonth", label: "Content Requests / Month" },
];

const tierBadgeColor: Record<string, string> = {
  Starter: "bg-muted text-muted-foreground",
  Growth: "bg-primary/10 text-primary",
  Pro: "bg-success/10 text-success",
};

export default function RetainerSettings() {
  const { data: tiers = [], isLoading } = useRetainerTiers();
  const updateMutation = useUpdateRetainerTier();
  const [edits, setEdits] = useState<Record<string, EditableTier>>({});

  const getEditValues = (tier: RetainerTier): EditableTier => {
    return (
      edits[tier.id] ?? {
        blogsPerMonth: tier.blogsPerMonth,
        servicePagesPerMonth: tier.servicePagesPerMonth,
        pseoPagesPerMonth: tier.pseoPagesPerMonth,
        socialCascadesPerMonth: tier.socialCascadesPerMonth,
        emailSequencesPerMonth: tier.emailSequencesPerMonth,
        caseStudiesPerMonth: tier.caseStudiesPerMonth,
        revisionsPerPiece: tier.revisionsPerPiece,
        contentRequestsPerMonth: tier.contentRequestsPerMonth,
      }
    );
  };

  const handleFieldChange = (
    tierId: string,
    tier: RetainerTier,
    field: keyof EditableTier,
    value: string
  ) => {
    const current = getEditValues(tier);
    setEdits((prev) => ({
      ...prev,
      [tierId]: {
        ...current,
        [field]: Number(value) || 0,
      },
    }));
  };

  const handleSave = (tier: RetainerTier) => {
    const values = getEditValues(tier);
    updateMutation.mutate(
      {
        id: tier.id,
        ...values,
      },
      {
        onSuccess: () => {
          setEdits((prev) => {
            const next = { ...prev };
            delete next[tier.id];
            return next;
          });
        },
      }
    );
  };

  const hasChanges = (tier: RetainerTier): boolean => {
    const edited = edits[tier.id];
    if (!edited) return false;
    return FIELDS.some((f) => edited[f.key] !== tier[f.key]);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Retainer Settings</h1>
          <p className="text-muted-foreground">Manage retainer tier definitions</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Retainer Settings</h1>
        <p className="text-muted-foreground">
          Configure deliverable allocations for each retainer tier
        </p>
      </div>

      {tiers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground text-center">
              No retainer tiers found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => {
            const values = getEditValues(tier);
            const changed = hasChanges(tier);

            return (
              <Card key={tier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-display">{tier.name}</CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierBadgeColor[tier.name] || "bg-muted text-muted-foreground"}`}
                    >
                      {tier.name}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-sm text-muted-foreground">{field.label}</label>
                      <Input
                        type="number"
                        min={0}
                        value={values[field.key]}
                        onChange={(e) =>
                          handleFieldChange(tier.id, tier, field.key, e.target.value)
                        }
                      />
                    </div>
                  ))}

                  <Button
                    className="w-full"
                    disabled={!changed || updateMutation.isPending}
                    onClick={() => handleSave(tier)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
