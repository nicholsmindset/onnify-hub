import { useState } from "react";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TaskForm } from "@/components/forms/TaskForm";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@/types";
import { TaskFormValues } from "@/lib/validations";
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

const columns: TaskStatus[] = ["To Do", "In Progress", "Done", "Blocked"];

const columnColor: Record<TaskStatus, string> = {
  "To Do": "border-t-muted-foreground",
  "In Progress": "border-t-primary",
  "Done": "border-t-success",
  "Blocked": "border-t-destructive",
};

const categoryColor: Record<string, string> = {
  Admin: "bg-muted text-muted-foreground",
  Strategy: "bg-accent/10 text-accent",
  Content: "bg-primary/10 text-primary",
  Tech: "bg-success/10 text-success",
  Sales: "bg-warning/10 text-warning",
  Ops: "bg-secondary text-secondary-foreground",
};

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${isOver ? "bg-primary/5" : ""}`}>
      {children}
    </div>
  );
}

function DraggableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`border-t-2 ${columnColor[task.status]} cursor-grab active:cursor-grabbing`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight">{task.name}</p>
          {task.clientName && <p className="text-xs text-muted-foreground">{task.clientName}</p>}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColor[task.category]}`}>{task.category}</span>
            <span className="text-xs text-muted-foreground">{task.assignedTo}</span>
          </div>
          <p className="text-xs text-muted-foreground">Due: {task.dueDate}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Tasks() {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeItem, setActiveItem] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useTasks({ assignee: assigneeFilter, category: categoryFilter });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleCreate = (data: TaskFormValues) => {
    createMutation.mutate(
      {
        name: data.name,
        clientId: data.clientId || undefined,
        deliverableId: data.deliverableId || undefined,
        assignedTo: data.assignedTo,
        category: data.category,
        status: data.status,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
        taskId: "TSK-TMP",
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (data: TaskFormValues) => {
    if (!editTask) return;
    updateMutation.mutate(
      { id: editTask.id, ...data },
      { onSuccess: () => setEditTask(null) }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const item = tasks.find((t) => t.id === event.active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const current = tasks.find((t) => t.id === taskId);
    let newStatus = over.id as TaskStatus;

    // If dropped on a card instead of a column, use that card's status
    if (!columns.includes(newStatus)) {
      const targetItem = tasks.find((t) => t.id === over.id);
      if (targetItem) {
        newStatus = targetItem.status;
      } else {
        return;
      }
    }

    if (current && current.status !== newStatus) {
      updateMutation.mutate({ id: taskId, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Team Task Board</h1>
          <p className="text-muted-foreground">Internal task management</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
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
          <h1 className="text-2xl font-display font-bold">Team Task Board</h1>
          <p className="text-muted-foreground">Drag tasks between columns to update status</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Task</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <TaskForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
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
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["Admin", "Strategy", "Content", "Tech", "Sales", "Ops"].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = tasks.filter((t) => t.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">{col}</h3>
                  <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                </div>
                <DroppableColumn id={col}>
                  {items.map((t) => (
                    <DraggableTaskCard
                      key={t.id}
                      task={t}
                      onClick={() => setEditTask(t)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                      No tasks
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
                {activeItem.clientName && <p className="text-xs text-muted-foreground">{activeItem.clientName}</p>}
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {/* Edit Sheet */}
      <Sheet open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Task</SheetTitle>
          </SheetHeader>
          {editTask && (
            <div className="mt-6">
              <TaskForm
                defaultValues={editTask}
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
