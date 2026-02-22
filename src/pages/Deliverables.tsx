import { useState } from "react";
import { useDeliverables, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable } from "@/hooks/use-deliverables";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DeliverableForm } from "@/components/forms/DeliverableForm";
import { Plus } from "lucide-react";
import { Deliverable, DeliverableStatus } from "@/types";
import { DeliverableFormValues } from "@/lib/validations";
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

const columns: DeliverableStatus[] = ["Not Started", "In Progress", "Review", "Delivered", "Approved"];

const columnColor: Record<DeliverableStatus, string> = {
  "Not Started": "border-t-muted-foreground",
  "In Progress": "border-t-primary",
  "Review": "border-t-warning",
  "Delivered": "border-t-success",
  "Approved": "border-t-accent",
};

const priorityBadge: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-muted text-muted-foreground",
};

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${isOver ? "bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

function DraggableCard({ deliverable, onClick, isOverdue }: { deliverable: Deliverable; onClick: () => void; isOverdue: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: deliverable.id,
    data: { status: deliverable.status },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`border-t-2 ${columnColor[deliverable.status]} ${isOverdue ? "ring-1 ring-destructive/50" : ""} cursor-grab active:cursor-grabbing`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight">{deliverable.name}</p>
          <p className="text-xs text-muted-foreground">{deliverable.clientName}</p>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge[deliverable.priority]}`}>{deliverable.priority}</span>
            <span className="text-xs text-muted-foreground">{deliverable.assignedTo}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">{deliverable.serviceType}</Badge>
            <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {deliverable.dueDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Deliverables() {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeliverable, setEditDeliverable] = useState<Deliverable | null>(null);
  const [activeItem, setActiveItem] = useState<Deliverable | null>(null);

  const { data: deliverables = [], isLoading } = useDeliverables({ assignee: assigneeFilter, market: marketFilter });
  const createMutation = useCreateDeliverable();
  const updateMutation = useUpdateDeliverable();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const isOverdue = (dueDate: string, status: DeliverableStatus) => {
    return new Date(dueDate) < new Date() && status !== "Delivered" && status !== "Approved";
  };

  const handleCreate = (data: DeliverableFormValues) => {
    createMutation.mutate(
      {
        clientId: data.clientId,
        serviceType: data.serviceType,
        name: data.name,
        description: data.description || undefined,
        assignedTo: data.assignedTo,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        market: data.market,
        clientApproved: false,
        deliverableId: "DEL-TMP",
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (data: DeliverableFormValues) => {
    if (!editDeliverable) return;
    updateMutation.mutate(
      { id: editDeliverable.id, ...data },
      { onSuccess: () => setEditDeliverable(null) }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = deliverables.find((d) => d.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const deliverableId = active.id as string;
    const current = deliverables.find((d) => d.id === deliverableId);
    let newStatus = over.id as DeliverableStatus;

    // If dropped on a card instead of a column, use that card's status
    if (!columns.includes(newStatus)) {
      const targetItem = deliverables.find((d) => d.id === over.id);
      if (targetItem) {
        newStatus = targetItem.status;
      } else {
        return;
      }
    }

    if (current && current.status !== newStatus) {
      const updates: Partial<Deliverable> & { id: string } = { id: deliverableId, status: newStatus };
      if (newStatus === "Delivered" && !current.deliveryDate) {
        updates.deliveryDate = new Date().toISOString().split("T")[0];
      }
      if (newStatus === "Approved") {
        updates.clientApproved = true;
      }
      updateMutation.mutate(updates);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Deliverables Tracker</h1>
          <p className="text-muted-foreground">Kanban view</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
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
          <h1 className="text-2xl font-display font-bold">Deliverables Tracker</h1>
          <p className="text-muted-foreground">Drag cards between columns to update status</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Deliverable</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Deliverable</DialogTitle>
            </DialogHeader>
            <DeliverableForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
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
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Market" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
            <SelectItem value="ID">Indonesia</SelectItem>
            <SelectItem value="US">USA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {columns.map((col) => {
            const items = deliverables.filter((d) => d.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">{col}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <DroppableColumn id={col}>
                  {items.map((d) => (
                    <DraggableCard
                      key={d.id}
                      deliverable={d}
                      isOverdue={isOverdue(d.dueDate, d.status)}
                      onClick={() => setEditDeliverable(d)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                      No items
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <Card className={`border-t-2 ${columnColor[activeItem.status]} shadow-lg w-[250px]`}>
              <CardContent className="p-3 space-y-2">
                <p className="text-sm font-medium leading-tight">{activeItem.name}</p>
                <p className="text-xs text-muted-foreground">{activeItem.clientName}</p>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit Sheet */}
      <Sheet open={!!editDeliverable} onOpenChange={(open) => !open && setEditDeliverable(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Deliverable</SheetTitle>
          </SheetHeader>
          {editDeliverable && (
            <div className="mt-6">
              <DeliverableForm
                defaultValues={editDeliverable}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
