import { useState } from "react";
import { useContent, useCreateContent, useUpdateContent, useDeleteContent } from "@/hooks/use-content";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ContentForm } from "@/components/forms/ContentForm";
import { Plus, Trash2, Newspaper } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentItem, ContentStatus } from "@/types";
import { ContentFormValues } from "@/lib/validations";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

const columns: ContentStatus[] = ["Ideation", "Draft", "Review", "Approved", "Scheduled", "Published"];

const columnColor: Record<ContentStatus, string> = {
  Ideation: "border-t-muted-foreground",
  Draft: "border-t-yellow-500",
  Review: "border-t-primary",
  Approved: "border-t-green-500",
  Scheduled: "border-t-blue-500",
  Published: "border-t-emerald-600",
};

const typeColor: Record<string, string> = {
  Blog: "bg-blue-500/10 text-blue-600",
  "Social Post": "bg-pink-500/10 text-pink-600",
  "Email Campaign": "bg-purple-500/10 text-purple-600",
  Video: "bg-red-500/10 text-red-600",
  "Case Study": "bg-amber-500/10 text-amber-600",
  Newsletter: "bg-teal-500/10 text-teal-600",
};

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${isOver ? "bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

function DraggableContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { status: item.status },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`border-t-2 ${columnColor[item.status]} cursor-grab active:cursor-grabbing`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight">{item.title}</p>
          {item.clientName && <p className="text-xs text-muted-foreground">{item.clientName}</p>}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded ${typeColor[item.contentType] || "bg-muted"}`}>{item.contentType}</span>
            {item.platform && <span className="text-xs text-muted-foreground">{item.platform}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{item.assignedTo}</span>
            <span className="text-xs text-muted-foreground">Due: {item.dueDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContentPipeline() {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null);

  const { data: content = [], isLoading } = useContent({ assignee: assigneeFilter, contentType: typeFilter });
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleCreate = (data: ContentFormValues) => {
    createMutation.mutate(
      { ...data, contentId: "CNT-TMP", platform: data.platform || undefined, clientId: data.clientId || undefined },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (data: ContentFormValues) => {
    if (!editItem) return;
    updateMutation.mutate(
      { id: editItem.id, ...data, platform: data.platform || undefined, clientId: data.clientId || undefined },
      { onSuccess: () => setEditItem(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    deleteMutation.mutate(deleteItem.id, { onSuccess: () => setDeleteItem(null) });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = content.find((c) => c.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const current = content.find((c) => c.id === itemId);
    let newStatus = over.id as ContentStatus;

    // If dropped on a card instead of a column, use that card's status
    if (!columns.includes(newStatus)) {
      const targetItem = content.find((c) => c.id === over.id);
      if (targetItem) {
        newStatus = targetItem.status;
      } else {
        return;
      }
    }

    if (current && current.status !== newStatus) {
      updateMutation.mutate({ id: itemId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Content Pipeline</h1>
          <p className="text-muted-foreground">Manage content across all stages</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Content Pipeline</h1>
          <p className="text-muted-foreground">Drag content between stages to update status</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Content</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Content Item</DialogTitle>
              <DialogDescription>Add a new content item to the pipeline.</DialogDescription>
            </DialogHeader>
            <ContentForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="Robert">Robert</SelectItem>
            <SelectItem value="Lina">Lina</SelectItem>
            <SelectItem value="Freelancer">Freelancer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {["Blog", "Social Post", "Email Campaign", "Video", "Case Study", "Newsletter"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty state when no content at all */}
      {content.length === 0 && (
        <EmptyState
          icon={Newspaper}
          title="No content yet"
          description="Add your first content item to start managing your content pipeline across all stages."
          actionLabel="Add Content"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {content.length > 0 && (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {columns.map((col) => {
            const items = content.filter((c) => c.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{col}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <DroppableColumn id={col}>
                  {items.map((item) => (
                    <DraggableContentCard
                      key={item.id}
                      item={item}
                      onClick={() => setEditItem(item)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                      No content
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <Card className={`border-t-2 ${columnColor[activeItem.status]} shadow-lg w-[200px]`}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium leading-tight">{activeItem.title}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded ${typeColor[activeItem.contentType] || "bg-muted"}`}>{activeItem.contentType}</span>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Edit Content
              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setEditItem(null); setDeleteItem(editItem); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </SheetTitle>
          </SheetHeader>
          {editItem && (
            <div className="mt-6">
              <ContentForm defaultValues={editItem} onSubmit={handleUpdate} isLoading={updateMutation.isPending} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
