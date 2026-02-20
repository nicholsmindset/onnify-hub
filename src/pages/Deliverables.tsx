import { useState } from "react";
import { mockDeliverables } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliverableStatus } from "@/types";

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

export default function Deliverables() {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");

  const filtered = mockDeliverables.filter((d) => {
    const matchesAssignee = assigneeFilter === "all" || d.assignedTo === assigneeFilter;
    const matchesMarket = marketFilter === "all" || d.market === marketFilter;
    return matchesAssignee && matchesMarket;
  });

  const isOverdue = (dueDate: string, status: DeliverableStatus) => {
    return new Date(dueDate) < new Date() && status !== "Delivered" && status !== "Approved";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Deliverables Tracker</h1>
        <p className="text-muted-foreground">Kanban view — drag-and-drop coming soon</p>
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

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const items = filtered.filter((d) => d.status === col);
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">{col}</h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((d) => (
                  <Card key={d.id} className={`border-t-2 ${columnColor[col]} ${isOverdue(d.dueDate, d.status) ? "ring-1 ring-destructive/50" : ""}`}>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium leading-tight">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.clientName}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge[d.priority]}`}>{d.priority}</span>
                        <span className="text-xs text-muted-foreground">{d.assignedTo}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">{d.serviceType}</Badge>
                        <span className={`text-xs ${isOverdue(d.dueDate, d.status) ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {d.dueDate}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
