import { useState } from "react";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useApplyTemplate,
} from "@/hooks/use-templates";
import { useClients } from "@/hooks/use-clients";
import { ProjectTemplate } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ListChecks,
} from "lucide-react";

// ─── Category helpers ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "social_media", label: "Social Media" },
  { value: "branding", label: "Branding" },
  { value: "web_design", label: "Web Design" },
  { value: "custom", label: "Custom" },
] as const;

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function categoryColor(value: string) {
  switch (value) {
    case "social_media":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "branding":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    case "web_design":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// ─── Nested form state types ─────────────────────────────────────────────────

interface FormTask {
  name: string;
  priority: string;
}

interface FormDeliverable {
  name: string;
  description: string;
  expanded: boolean;
  tasks: FormTask[];
}

function emptyDeliverable(): FormDeliverable {
  return { name: "", description: "", expanded: true, tasks: [] };
}

function emptyTask(): FormTask {
  return { name: "", priority: "medium" };
}

// ─── Template Form Dialog ────────────────────────────────────────────────────

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTemplate?: ProjectTemplate | null;
}

function TemplateFormDialog({ open, onOpenChange, editTemplate }: TemplateFormDialogProps) {
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const [name, setName] = useState<string>(editTemplate?.name ?? "");
  const [description, setDescription] = useState<string>(editTemplate?.description ?? "");
  const [category, setCategory] = useState<string>(editTemplate?.category ?? "custom");
  const [deliverables, setDeliverables] = useState<FormDeliverable[]>([]);

  // Reset form whenever dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setName(editTemplate?.name ?? "");
      setDescription(editTemplate?.description ?? "");
      setCategory(editTemplate?.category ?? "custom");
      setDeliverables(
        editTemplate?.deliverables?.map((d) => ({
          name: d.name,
          description: d.description ?? "",
          expanded: false,
          tasks: d.tasks?.map((t) => ({ name: t.name, priority: t.priority })) ?? [],
        })) ?? []
      );
    }
    onOpenChange(v);
  };

  const isEditing = !!editTemplate;
  const isPending = createMutation.isPending || updateMutation.isPending;

  function addDeliverable() {
    setDeliverables((prev) => [...prev, emptyDeliverable()]);
  }

  function removeDeliverable(i: number) {
    setDeliverables((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleDeliverable(i: number) {
    setDeliverables((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, expanded: !d.expanded } : d))
    );
  }

  function updateDeliverable(i: number, field: keyof Pick<FormDeliverable, "name" | "description">, value: string) {
    setDeliverables((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d))
    );
  }

  function addTask(delIdx: number) {
    setDeliverables((prev) =>
      prev.map((d, idx) =>
        idx === delIdx ? { ...d, tasks: [...d.tasks, emptyTask()] } : d
      )
    );
  }

  function removeTask(delIdx: number, taskIdx: number) {
    setDeliverables((prev) =>
      prev.map((d, idx) =>
        idx === delIdx
          ? { ...d, tasks: d.tasks.filter((_, ti) => ti !== taskIdx) }
          : d
      )
    );
  }

  function updateTask(delIdx: number, taskIdx: number, field: keyof FormTask, value: string) {
    setDeliverables((prev) =>
      prev.map((d, idx) =>
        idx === delIdx
          ? {
              ...d,
              tasks: d.tasks.map((t, ti) =>
                ti === taskIdx ? { ...t, [field]: value } : t
              ),
            }
          : d
      )
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && editTemplate) {
      updateMutation.mutate(
        { id: editTemplate.id, name: name.trim(), description: description || undefined, category },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          description: description || undefined,
          category,
          deliverables: deliverables
            .filter((d) => d.name.trim())
            .map((d) => ({
              name: d.name.trim(),
              description: d.description || undefined,
              tasks: d.tasks.filter((t) => t.name.trim()).map((t) => ({
                name: t.name.trim(),
                priority: t.priority,
              })),
            })),
        },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "New Template"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the template name, description, and category."
              : "Define a reusable project template with deliverables and tasks."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="tmpl-name">Name <span className="text-destructive">*</span></Label>
            <Input
              id="tmpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly Social Media Package"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="tmpl-desc">Description</Label>
            <Textarea
              id="tmpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this template includes"
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="tmpl-cat">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="tmpl-cat">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deliverables — only shown when creating */}
          {!isEditing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Deliverables</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDeliverable}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Deliverable
                </Button>
              </div>

              {deliverables.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No deliverables added yet. Click "Add Deliverable" to define the structure.
                </p>
              )}

              <div className="space-y-3">
                {deliverables.map((del, di) => (
                  <div key={di} className="border rounded-lg p-3 space-y-3 bg-muted/30">
                    {/* Deliverable header */}
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        className="mt-2 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleDeliverable(di)}
                      >
                        {del.expanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={del.name}
                          onChange={(e) => updateDeliverable(di, "name", e.target.value)}
                          placeholder="Deliverable name"
                          className="bg-background"
                        />
                        {del.expanded && (
                          <Input
                            value={del.description}
                            onChange={(e) => updateDeliverable(di, "description", e.target.value)}
                            placeholder="Description (optional)"
                            className="bg-background text-sm"
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0 mt-1"
                        onClick={() => removeDeliverable(di)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Tasks */}
                    {del.expanded && (
                      <div className="pl-6 space-y-2">
                        {del.tasks.map((task, ti) => (
                          <div key={ti} className="flex items-center gap-2">
                            <Input
                              value={task.name}
                              onChange={(e) => updateTask(di, ti, "name", e.target.value)}
                              placeholder="Task name"
                              className="bg-background text-sm flex-1"
                            />
                            <Select
                              value={task.priority}
                              onValueChange={(v) => updateTask(di, ti, "priority", v)}
                            >
                              <SelectTrigger className="w-[110px] bg-background text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PRIORITIES.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive shrink-0"
                              onClick={() => removeTask(di, ti)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => addTask(di)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Task
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Apply to Client Dialog ──────────────────────────────────────────────────

interface ApplyDialogProps {
  template: ProjectTemplate | null;
  onClose: () => void;
}

function ApplyDialog({ template, onClose }: ApplyDialogProps) {
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const applyMutation = useApplyTemplate();
  const [clientId, setClientId] = useState("");

  function handleApply() {
    if (!template || !clientId) return;
    applyMutation.mutate(
      { templateId: template.id, clientId },
      { onSuccess: () => { setClientId(""); onClose(); } }
    );
  }

  return (
    <Dialog open={!!template} onOpenChange={(v) => { if (!v) { setClientId(""); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply Template to Client</DialogTitle>
          <DialogDescription>
            This will create deliverables and tasks from &quot;{template?.name}&quot; for the selected client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Select Client</Label>
            {clientsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setClientId(""); onClose(); }}>
            Cancel
          </Button>
          <Button
            disabled={!clientId || applyMutation.isPending}
            onClick={handleApply}
          >
            {applyMutation.isPending ? "Applying…" : "Apply Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Template Card ───────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: ProjectTemplate;
  onEdit: (t: ProjectTemplate) => void;
  onDelete: (t: ProjectTemplate) => void;
  onApply: (t: ProjectTemplate) => void;
}

function TemplateCard({ template, onEdit, onDelete, onApply }: TemplateCardProps) {
  const deliverableCount = template.deliverables?.length ?? 0;
  const taskCount = template.deliverables?.reduce(
    (sum, d) => sum + (d.tasks?.length ?? 0),
    0
  ) ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${categoryColor(template.category)}`}
          >
            {categoryLabel(template.category)}
          </span>
        </div>
        {template.description && (
          <CardDescription className="text-sm line-clamp-2">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3 flex-1">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            {deliverableCount} deliverable{deliverableCount !== 1 ? "s" : ""}
          </span>
          {taskCount > 0 && (
            <span>· {taskCount} task{taskCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex items-center justify-between gap-2">
        <Button size="sm" onClick={() => onApply(template)}>
          Apply to Client
        </Button>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(template)}
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(template)}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Templates() {
  const { data: templates = [], isLoading } = useTemplates();
  const deleteMutation = useDeleteTemplate();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<ProjectTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<ProjectTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<ProjectTemplate | null>(null);

  function handleDelete() {
    if (!deleteTemplate) return;
    deleteMutation.mutate(deleteTemplate.id, {
      onSuccess: () => setDeleteTemplate(null),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Project Templates</h1>
          <p className="text-muted-foreground">
            Reusable templates with pre-defined deliverables and tasks
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create your first project template to quickly spin up deliverables and tasks for any client."
          actionLabel="New Template"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={setEditTemplate}
              onDelete={setDeleteTemplate}
              onApply={setApplyTemplate}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <TemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Edit Dialog */}
      <TemplateFormDialog
        open={!!editTemplate}
        onOpenChange={(v) => { if (!v) setEditTemplate(null); }}
        editTemplate={editTemplate}
      />

      {/* Apply Dialog */}
      <ApplyDialog
        template={applyTemplate}
        onClose={() => setApplyTemplate(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTemplate}
        onOpenChange={(v) => { if (!v) setDeleteTemplate(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTemplate?.name}&quot;? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
