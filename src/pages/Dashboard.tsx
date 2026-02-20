import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockClients, mockDeliverables, mockInvoices, mockTasks } from "@/data/mock-data";
import { Users, FileCheck, Receipt, ListTodo, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const activeClients = mockClients.filter((c) => c.status === "Active");
  const sgClients = activeClients.filter((c) => c.market === "SG").length;
  const idClients = activeClients.filter((c) => c.market === "ID").length;
  const usClients = activeClients.filter((c) => c.market === "US").length;

  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const dueThisWeek = mockDeliverables.filter((d) => {
    const due = new Date(d.dueDate);
    return due >= now && due <= weekFromNow && d.status !== "Delivered" && d.status !== "Approved";
  });

  const overdue = mockDeliverables.filter((d) => {
    return new Date(d.dueDate) < now && d.status !== "Delivered" && d.status !== "Approved";
  });

  const revenueThisMonth = mockInvoices
    .filter((i) => i.month === "2026-02" && i.currency === "SGD")
    .reduce((sum, i) => sum + i.amount, 0);

  const revenueUSD = mockInvoices
    .filter((i) => i.month === "2026-02" && i.currency === "USD")
    .reduce((sum, i) => sum + i.amount, 0);

  const tasksByPerson = mockTasks.reduce((acc, t) => {
    if (t.status !== "Done") {
      acc[t.assignedTo] = (acc[t.assignedTo] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">ONNIFY WORKS operations overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{activeClients.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">SG {sgClients}</Badge>
                <Badge variant="outline" className="text-xs">ID {idClients}</Badge>
                <Badge variant="outline" className="text-xs">US {usClients}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/deliverables">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Due This Week</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{dueThisWeek.length}</div>
              <p className="text-xs text-muted-foreground mt-1">deliverables pending</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Feb)</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">${revenueThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">SGD · +${revenueUSD} USD</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/tasks">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{Object.values(tasksByPerson).reduce((a, b) => a + b, 0)}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(tasksByPerson).map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-xs">{name}: {count}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Overdue + Due This Week */}
      <div className="grid gap-4 lg:grid-cols-2">
        {overdue.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-medium text-destructive">Overdue Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdue.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.clientName} · {d.assignedTo}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">Due {d.dueDate}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {dueThisWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
            ) : (
              <div className="space-y-2">
                {dueThisWeek.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-muted">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.clientName} · {d.assignedTo}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{d.dueDate}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
