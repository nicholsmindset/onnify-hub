import { useState, useEffect } from "react";
import { useDeliverables, useCreateDeliverable, useUpdateDeliverable, useDeleteDeliverable } from "@/hooks/use-deliverables";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DeliverableForm } from "@/components/forms/DeliverableForm";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Plus, Clock, Download, Trash2, FileCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Deliverable, DeliverableStatus } from "@/types";
import { TimeLogDialog } from "@/components/TimeLogDialog";
import { DeliverableFormValues } from "@/lib/validations";
import { exportToCSV } from "@/lib/export";
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

function DraggableCard({ deliverable, onClick, isOverdue, onLogTime, isSelected, onToggleSelect }: {
  deliverable: Deliverable;
  onClick: () => void;
  isOverdue: boolean;
  onLogTime: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
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
        className={`border-t-2 ${columnColor[deliverable.status]} ${isOverdue ? "ring-1 ring-destructive/50" : ""} ${isSelected ? "ring-2 ring-primary" : ""} cursor-grab active:cursor-grabbing`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div onClick={(e) => { e.stopPropagation(); onToggleSelect(); }} className="mt-0.5 flex-shrink-0">
              <Checkbox checked={isSelected} />
            </div>
            <p className="text-sm font-medium leading-tight flex-1">{deliverable.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">{deliverable.clientName}</p>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge[deliverable.priority]}`}>{deliverable.priority}</span>
            <span className="text-xs text-muted-foreground">{deliverable.assignedTo}</span>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">{deliverable.serviceType}</Badge>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {deliverable.dueDate}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); onLogTime(); }}
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
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

  // Cmd+N shortcut: open create dialog
  useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("keyboard:new-item", handler);
    return () => window.removeEventListener("keyboard:new-item", handler);
  }, []);
  const [timeLogDeliverable, setTimeLogDeliverable] = useState<{ id: string; clientId: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: deliverables = [], isLoading } = useDeliverables({ assignee: assigneeFilter, market: marketFilter });
  const createMutation = useCreateDeliverable();
  const updateMutation = useUpdateDeliverable();
  const deleteMutation = useDeleteDeliverable();

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedDeliverables = deliverables.filter(d => selectedIds.has(d.id));

  function handleBulkExport() {
    exportToCSV(
      selectedDeliverables.map(d => ({
        ID: d.deliverableId,
        Name: d.name,
        Client: d.clientName ?? "",
        Status: d.status,
        Priority: d.priority,
        "Due Date": d.dueDate,
        "Assigned To": d.assignedTo,
      })),
      "deliverables-selected"
    );
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} deliverable(s)? This cannot be undone.`)) return;
    const ids = [...selectedIds];
    Promise.all(ids.map(id => deleteMutation.mutateAsync(id))).then(() => {
      setSelectedIds(new Set());
    });
  }

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
              <DialogDescription>Create a new deliverable for a client.</DialogDescription>
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

      {/* Empty state when no deliverables at all */}
      {deliverables.length === 0 && (
        <EmptyState
          icon={FileCheck}
          title="No deliverables yet"
          description="Create your first deliverable to start tracking work across your client projects."
          actionLabel="Add Deliverable"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {/* Kanban Board with DnD */}
      {deliverables.length > 0 && (
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
                      onLogTime={() => setTimeLogDeliverable({ id: d.id, clientId: d.clientId, name: d.name })}
                      isSelected={selectedIds.has(d.id)}
                      onToggleSelect={() => toggleSelect(d.id)}
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
      )}

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

      {/* Time Log Dialog */}
      <TimeLogDialog
        open={!!timeLogDeliverable}
        onOpenChange={(open) => !open && setTimeLogDeliverable(null)}
        clientId={timeLogDeliverable?.clientId ?? ""}
        deliverableId={timeLogDeliverable?.id}
        taskName={timeLogDeliverable?.name}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            label: "Export Selected",
            icon: <Download className="h-3.5 w-3.5 mr-1.5" />,
            onClick: handleBulkExport,
            variant: "outline",
          },
          {
            label: "Delete Selected",
            icon: <Trash2 className="h-3.5 w-3.5 mr-1.5" />,
            onClick: handleBulkDelete,
            variant: "destructive",
          },
        ]}
      />
    </div>
  );
}
