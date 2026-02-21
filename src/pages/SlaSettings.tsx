import { useState } from "react";
import { useSlaDefinitions, useUpdateSlaDefinition } from "@/hooks/use-sla";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { SlaDefinition } from "@/types";

interface EditableRow {
  briefToDraftDays: number;
  draftToReviewDays: number;
  reviewToPublishDays: number;
  totalDays: number;
}

export default function SlaSettings() {
  const { data: definitions = [], isLoading } = useSlaDefinitions();
  const updateMutation = useUpdateSlaDefinition();
  const [edits, setEdits] = useState<Record<string, EditableRow>>({});

  const getEditValues = (def: SlaDefinition): EditableRow => {
    return (
      edits[def.id] ?? {
        briefToDraftDays: def.briefToDraftDays,
        draftToReviewDays: def.draftToReviewDays,
        reviewToPublishDays: def.reviewToPublishDays,
        totalDays: def.totalDays,
      }
    );
  };

  const handleFieldChange = (
    defId: string,
    def: SlaDefinition,
    field: keyof EditableRow,
    value: string
  ) => {
    const current = getEditValues(def);
    setEdits((prev) => ({
      ...prev,
      [defId]: {
        ...current,
        [field]: Number(value) || 0,
      },
    }));
  };

  const handleSave = (def: SlaDefinition) => {
    const values = getEditValues(def);
    updateMutation.mutate(
      {
        id: def.id,
        briefToDraftDays: values.briefToDraftDays,
        draftToReviewDays: values.draftToReviewDays,
        reviewToPublishDays: values.reviewToPublishDays,
        totalDays: values.totalDays,
      },
      {
        onSuccess: () => {
          setEdits((prev) => {
            const next = { ...prev };
            delete next[def.id];
            return next;
          });
        },
      }
    );
  };

  const hasChanges = (def: SlaDefinition): boolean => {
    const edited = edits[def.id];
    if (!edited) return false;
    return (
      edited.briefToDraftDays !== def.briefToDraftDays ||
      edited.draftToReviewDays !== def.draftToReviewDays ||
      edited.reviewToPublishDays !== def.reviewToPublishDays ||
      edited.totalDays !== def.totalDays
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">SLA Settings</h1>
          <p className="text-muted-foreground">Manage SLA definitions for content types</p>
        </div>
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">SLA Settings</h1>
        <p className="text-muted-foreground">
          Configure turnaround times for each content type
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">SLA Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          {definitions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No SLA definitions found
            </p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content Type</TableHead>
                    <TableHead className="text-center">Brief to Draft (days)</TableHead>
                    <TableHead className="text-center">Draft to Review (days)</TableHead>
                    <TableHead className="text-center">Review to Publish (days)</TableHead>
                    <TableHead className="text-center">Total (days)</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {definitions.map((def) => {
                    const values = getEditValues(def);
                    const changed = hasChanges(def);

                    return (
                      <TableRow key={def.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {def.contentType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20 mx-auto text-center"
                            value={values.briefToDraftDays}
                            onChange={(e) =>
                              handleFieldChange(def.id, def, "briefToDraftDays", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20 mx-auto text-center"
                            value={values.draftToReviewDays}
                            onChange={(e) =>
                              handleFieldChange(def.id, def, "draftToReviewDays", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20 mx-auto text-center"
                            value={values.reviewToPublishDays}
                            onChange={(e) =>
                              handleFieldChange(def.id, def, "reviewToPublishDays", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20 mx-auto text-center"
                            value={values.totalDays}
                            onChange={(e) =>
                              handleFieldChange(def.id, def, "totalDays", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!changed || updateMutation.isPending}
                            onClick={() => handleSave(def)}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
