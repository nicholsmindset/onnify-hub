import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, CheckCircle, Clock, Users } from "lucide-react";
import { useState } from "react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const [marketFilter, setMarketFilter] = useState("all");

  const { data: clients = [], isLoading: l1 } = useClients();
  const { data: deliverables = [], isLoading: l2 } = useDeliverables();
  const { data: invoices = [], isLoading: l3 } = useInvoices();
  const { data: tasks = [], isLoading: l4 } = useTasks();

  const isLoading = l1 || l2 || l3 || l4;

  const filterByMarket = <T extends { market?: string }>(items: T[]) =>
    marketFilter === "all" ? items : items.filter((i) => i.market === marketFilter);

  const filteredClients = filterByMarket(clients);
  const filteredDeliverables = filterByMarket(deliverables);
  const filteredInvoices = filterByMarket(invoices);
  const filteredTasks = filterByMarket(tasks);

  // Revenue by month
  const revenueByMonth = filteredInvoices
    .filter((i) => i.status === "Paid")
    .reduce((acc, inv) => {
      const month = inv.month;
      acc[month] = (acc[month] || 0) + inv.amount;
      return acc;
    }, {} as Record<string, number>);

  const revenueChartData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  // Revenue by market
  const revenueByMarket = filteredInvoices
    .filter((i) => i.status === "Paid")
    .reduce((acc, inv) => {
      acc[inv.market] = (acc[inv.market] || 0) + inv.amount;
      return acc;
    }, {} as Record<string, number>);

  const marketChartData = Object.entries(revenueByMarket).map(([name, value]) => ({ name, value }));

  // Deliverable status breakdown
  const delivStatusCounts = filteredDeliverables.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const delivChartData = Object.entries(delivStatusCounts).map(([name, value]) => ({ name, value }));

  // Client health (based on active deliverables + invoice status)
  const clientHealth = filteredClients
    .filter((c) => c.status === "Active")
    .map((c) => {
      const clientDeliverables = deliverables.filter((d) => d.clientId === c.id);
      const overdueDeliverables = clientDeliverables.filter(
        (d) => new Date(d.dueDate) < new Date() && d.status !== "Delivered" && d.status !== "Approved"
      );
      const clientInvoices = invoices.filter((i) => i.clientId === c.id);
      const overdueInvoices = clientInvoices.filter((i) => i.status === "Overdue");

      let health: "Healthy" | "At Risk" | "Critical" = "Healthy";
      if (overdueDeliverables.length > 0 || overdueInvoices.length > 0) health = "At Risk";
      if (overdueDeliverables.length > 2 || overdueInvoices.length > 1) health = "Critical";

      return {
        name: c.companyName,
        market: c.market,
        monthlyValue: c.monthlyValue,
        activeDeliverables: clientDeliverables.filter((d) => d.status !== "Approved" && d.status !== "Delivered").length,
        overdueCount: overdueDeliverables.length,
        health,
      };
    });

  const healthColors: Record<string, string> = {
    Healthy: "bg-green-500/10 text-green-600",
    "At Risk": "bg-yellow-500/10 text-yellow-600",
    Critical: "bg-red-500/10 text-red-600",
  };

  // Summary stats
  const totalRevenue = filteredInvoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);
  const completionRate = filteredDeliverables.length > 0
    ? Math.round((filteredDeliverables.filter((d) => d.status === "Delivered" || d.status === "Approved").length / filteredDeliverables.length) * 100)
    : 0;
  const taskCompletionRate = filteredTasks.length > 0
    ? Math.round((filteredTasks.filter((t) => t.status === "Done").length / filteredTasks.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Reports</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Reporting Dashboard</h1>
          <p className="text-muted-foreground">Revenue, performance, and client health analytics</p>
        </div>
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Market" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
            <SelectItem value="ID">Indonesia</SelectItem>
            <SelectItem value="US">USA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (Paid)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">{filteredDeliverables.filter((d) => d.status === "Delivered" || d.status === "Approved").length} of {filteredDeliverables.length} deliverables</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Task Completion</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{taskCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">{filteredTasks.filter((t) => t.status === "Done").length} of {filteredTasks.length} tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{filteredClients.filter((c) => c.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">of {filteredClients.length} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Revenue by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No paid invoices yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Deliverable Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {delivChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={delivChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {delivChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No deliverables yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Market */}
      {marketFilter === "all" && marketChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue by Market</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marketChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={40} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Client Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Client Health Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {clientHealth.length > 0 ? (
            <div className="space-y-2">
              {clientHealth.map((ch) => (
                <div key={ch.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${healthColors[ch.health]}`}>{ch.health}</span>
                    <div>
                      <p className="text-sm font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">{ch.activeDeliverables} active deliverables · {ch.overdueCount} overdue</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{ch.market}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">${ch.monthlyValue}/mo</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No active clients</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
