import { useState } from "react";
import { usePipelineClients, useUpdateClientStage } from "@/hooks/use-pipeline";
import { Client } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Kanban, Plus } from "lucide-react";
import { Link } from "react-router-dom";
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

type PipelineStage = "lead" | "qualified" | "proposal_sent" | "negotiation" | "won" | "lost";

interface ColumnConfig {
  id: PipelineStage;
  label: string;
  borderColor: string;
  headerColor: string;
}

const columns: ColumnConfig[] = [
  { id: "lead", label: "Lead", borderColor: "border-l-slate-400", headerColor: "text-slate-600 dark:text-slate-400" },
  { id: "qualified", label: "Qualified", borderColor: "border-l-blue-500", headerColor: "text-blue-600 dark:text-blue-400" },
  { id: "proposal_sent", label: "Proposal Sent", borderColor: "border-l-violet-500", headerColor: "text-violet-600 dark:text-violet-400" },
  { id: "negotiation", label: "Negotiation", borderColor: "border-l-amber-500", headerColor: "text-amber-600 dark:text-amber-400" },
  { id: "won", label: "Won", borderColor: "border-l-green-500", headerColor: "text-green-600 dark:text-green-400" },
  { id: "lost", label: "Lost", borderColor: "border-l-red-500", headerColor: "text-red-600 dark:text-red-400" },
];

const columnIds = columns.map((c) => c.id);

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "No contact";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

function getHealthBadge(client: Client) {
  const stage = client.pipelineStage;
  if (stage === "won") return { label: "Won", className: "bg-green-500/10 text-green-600 dark:text-green-400" };
  if (stage === "lost") return { label: "Lost", className: "bg-red-500/10 text-red-600 dark:text-red-400" };
  if (stage === "negotiation") return { label: "Hot", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
  if (stage === "proposal_sent") return { label: "Active", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" };
  if (stage === "qualified") return { label: "Warm", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
  return { label: "New", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400" };
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[120px] rounded-lg p-1 transition-colors ${isOver ? "bg-primary/5" : ""}`}
    >
      {children}
    </div>
  );
}

function DraggableClientCard({ client }: { client: Client }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: client.id,
    data: { stage: client.pipelineStage },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const colConfig = columns.find((c) => c.id === client.pipelineStage) ?? columns[0];
  const health = getHealthBadge(client);
  const estimatedValue = client.estimatedValue ?? 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`border-l-4 ${colConfig.borderColor} cursor-grab active:cursor-grabbing`}>
        <CardContent className="p-3 space-y-2">
          <p className="text-sm font-medium leading-tight">{client.companyName}</p>
          {client.primaryContact && (
            <p className="text-xs text-muted-foreground">{client.primaryContact}</p>
          )}
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-semibold text-foreground">
              ${estimatedValue.toLocaleString()}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${health.className}`}>
              {health.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(client.lastContactAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Pipeline() {
  const [activeClient, setActiveClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = usePipelineClients();
  const updateStage = useUpdateClientStage();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const client = clients.find((c) => c.id === String(event.active.id));
    setActiveClient(client ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveClient(null);
    const { active, over } = event;
    if (!over) return;

    const clientId = String(active.id);
    const current = clients.find((c) => c.id === clientId);
    const overId = String(over.id);
    let newStage = overId as PipelineStage;

    // If dropped on a card instead of a column, resolve the card's stage
    if (!columnIds.includes(newStage)) {
      const targetClient = clients.find((c) => c.id === overId);
      if (targetClient && targetClient.pipelineStage) {
        newStage = targetClient.pipelineStage as PipelineStage;
      } else {
        return;
      }
    }

    if (current && current.pipelineStage !== newStage) {
      updateStage.mutate({ id: clientId, stage: newStage });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track prospects through your sales stages</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const hasClients = clients.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">Track prospects through your sales stages</p>
        </div>
        <Button asChild>
          <Link to="/clients">
            <Plus className="h-4 w-4 mr-2" />
            Add Prospect
          </Link>
        </Button>
      </div>

      {!hasClients && (
        <EmptyState
          icon={Kanban}
          title="No clients in pipeline"
          description="Add your first prospect or client to start tracking them through your sales stages."
          actionLabel="Add Prospect"
          onAction={() => window.location.href = "/clients"}
        />
      )}

      {hasClients && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {columns.map((col) => {
              const items = clients.filter(
                (c) => (c.pipelineStage ?? "lead") === col.id
              );
              return (
                <div key={col.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${col.headerColor}`}>
                      {col.label}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  <DroppableColumn id={col.id}>
                    {items.map((client) => (
                      <DraggableClientCard key={client.id} client={client} />
                    ))}
                    {items.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                        No prospects
                      </div>
                    )}
                  </DroppableColumn>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeClient && (
              <Card
                className={`border-l-4 ${
                  columns.find((c) => c.id === activeClient.pipelineStage)?.borderColor ?? "border-l-slate-400"
                } shadow-lg w-[200px]`}
              >
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-medium leading-tight">{activeClient.companyName}</p>
                  <span className="text-xs font-semibold text-foreground">
                    ${(activeClient.estimatedValue ?? 0).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
