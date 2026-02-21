import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContentPerformance, useUpdateContentPerformance } from "@/hooks/use-content-performance";
import { contentPerformanceSchema, ContentPerformanceFormValues } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Pencil, Plus } from "lucide-react";
import { PerformanceTier } from "@/types";

interface PerformanceTrackerProps {
  contentId: string;
}

const tierColor: Record<string, string> = {
  high: "bg-green-500/10 text-green-600",
  mid: "bg-yellow-500/10 text-yellow-600",
  low: "bg-red-500/10 text-red-600",
};

export function PerformanceTracker({ contentId }: PerformanceTrackerProps) {
  const [editOpen, setEditOpen] = useState(false);

  const { data: performance, isLoading } = useContentPerformance(contentId);
  const updateMutation = useUpdateContentPerformance();

  const form = useForm<ContentPerformanceFormValues>({
    resolver: zodResolver(contentPerformanceSchema),
    defaultValues: {
      impressions: 0,
      clicks: 0,
      avgPosition: 0,
      performanceTier: undefined,
    },
  });

  const handleOpenEdit = () => {
    if (performance) {
      form.reset({
        impressions: performance.impressions,
        clicks: performance.clicks,
        avgPosition: performance.avgPosition ?? 0,
        performanceTier: performance.performanceTier as PerformanceTier | undefined,
      });
    } else {
      form.reset({
        impressions: 0,
        clicks: 0,
        avgPosition: 0,
        performanceTier: undefined,
      });
    }
    setEditOpen(true);
  };

  const handleSubmit = (data: ContentPerformanceFormValues) => {
    updateMutation.mutate(
      {
        contentId,
        impressions: data.impressions,
        clicks: data.clicks,
        avgPosition: data.avgPosition,
        performanceTier: data.performanceTier,
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
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3)
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
        <CardTitle className="text-lg">Performance</CardTitle>
        {performance ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {!performance ? (
          <div className="text-center py-8">
            <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No performance data</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleOpenEdit}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Data
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impressions</p>
                <p className="text-2xl font-display font-bold">{performance.impressions.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clicks</p>
                <p className="text-2xl font-display font-bold">{performance.clicks.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Position</p>
                <p className="text-2xl font-display font-bold">
                  {performance.avgPosition != null ? performance.avgPosition.toFixed(1) : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Performance Tier</p>
                {performance.performanceTier ? (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierColor[performance.performanceTier] || "bg-muted text-muted-foreground"}`}
                  >
                    {performance.performanceTier}
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>
            </div>

            {performance.lastUpdatedAt && (
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(performance.lastUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Update Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Performance Data</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="impressions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impressions</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clicks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clicks</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avgPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Position</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performanceTier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="mid">Mid</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Performance Data"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
