import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQualityScore, useUpdateQualityScore } from "@/hooks/use-quality-scores";
import { qualityScoreSchema, QualityScoreFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface QualityScorecardProps {
  contentId: string;
}

const dimensions = [
  { key: "seoScore" as const, label: "SEO", weight: "30%" },
  { key: "brandVoiceScore" as const, label: "Brand Voice", weight: "25%" },
  { key: "uniquenessScore" as const, label: "Uniqueness", weight: "20%" },
  { key: "humannessScore" as const, label: "Humanness", weight: "15%" },
  { key: "completenessScore" as const, label: "Completeness", weight: "10%" },
];

function getCompositeColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getCompositeBackground(score: number): string {
  if (score >= 70) return "bg-green-500/10";
  if (score >= 60) return "bg-yellow-500/10";
  return "bg-red-500/10";
}

export function QualityScorecard({ contentId }: QualityScorecardProps) {
  const [editOpen, setEditOpen] = useState(false);

  const { data: score, isLoading } = useQualityScore(contentId);
  const updateMutation = useUpdateQualityScore();

  const form = useForm<QualityScoreFormValues>({
    resolver: zodResolver(qualityScoreSchema),
    defaultValues: {
      seoScore: 0,
      brandVoiceScore: 0,
      uniquenessScore: 0,
      humannessScore: 0,
      completenessScore: 0,
    },
  });

  const handleOpenEdit = () => {
    if (score) {
      form.reset({
        seoScore: score.seoScore,
        brandVoiceScore: score.brandVoiceScore,
        uniquenessScore: score.uniquenessScore,
        humannessScore: score.humannessScore,
        completenessScore: score.completenessScore,
      });
    } else {
      form.reset({
        seoScore: 0,
        brandVoiceScore: 0,
        uniquenessScore: 0,
        humannessScore: 0,
        completenessScore: 0,
      });
    }
    setEditOpen(true);
  };

  const handleSubmit = (data: QualityScoreFormValues) => {
    updateMutation.mutate(
      {
        contentId,
        seoScore: data.seoScore,
        brandVoiceScore: data.brandVoiceScore,
        uniquenessScore: data.uniquenessScore,
        humannessScore: data.humannessScore,
        completenessScore: data.completenessScore,
      },
      {
        onSuccess: () => {
          setEditOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quality Scorecard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Quality Scorecard</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent>
        {!score ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Not scored yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenEdit}>
              Update Scores
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Composite Score */}
            <div className={`rounded-lg p-4 text-center ${getCompositeBackground(score.compositeScore)}`}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Composite Score</p>
              <p className={`text-4xl font-display font-bold mt-1 ${getCompositeColor(score.compositeScore)}`}>
                {score.compositeScore}
              </p>
              <p className="text-xs text-muted-foreground mt-1">out of 100</p>
            </div>

            {/* Dimension Breakdown */}
            <div className="space-y-3">
              {dimensions.map((dim) => {
                const value = score[dim.key];
                return (
                  <div key={dim.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {dim.label} ({dim.weight})
                      </span>
                      <span className="font-mono text-muted-foreground">{value}/100</span>
                    </div>
                    <Progress value={value} className="h-2" />
                  </div>
                );
              })}
            </div>

            {score.scoredBy && (
              <p className="text-xs text-muted-foreground">
                Scored by {score.scoredBy}
                {score.scoredAt && <> on {new Date(score.scoredAt).toLocaleDateString()}</>}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Update Scores Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Quality Scores</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {dimensions.map((dim) => (
                <FormField
                  key={dim.key}
                  control={form.control}
                  name={dim.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dim.label} ({dim.weight})
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Scores"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
