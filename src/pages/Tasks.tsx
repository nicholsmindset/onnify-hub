import { useState } from "react";
import { mockTasks } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatus } from "@/types";

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

export default function Tasks() {
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filtered = mockTasks.filter((t) => {
    const matchesAssignee = assigneeFilter === "all" || t.assignedTo === assigneeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesAssignee && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Team Task Board</h1>
        <p className="text-muted-foreground">Internal task management</p>
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
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Strategy">Strategy</SelectItem>
            <SelectItem value="Content">Content</SelectItem>
            <SelectItem value="Tech">Tech</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Ops">Ops</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = filtered.filter((t) => t.status === col);
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">{col}</h3>
                <Badge variant="secondary" className="text-xs">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((t) => (
                  <Card key={t.id} className={`border-t-2 ${columnColor[col]}`}>
                    <CardContent className="p-3 space-y-2">
                      <p className="text-sm font-medium leading-tight">{t.name}</p>
                      {t.clientName && <p className="text-xs text-muted-foreground">{t.clientName}</p>}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColor[t.category]}`}>{t.category}</span>
                        <span className="text-xs text-muted-foreground">{t.assignedTo}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Due: {t.dueDate}</p>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
                    No tasks
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
