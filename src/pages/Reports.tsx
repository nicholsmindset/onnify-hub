import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, DollarSign, CheckCircle, Clock, Users, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { ReportInsights } from "@/components/ai/ReportInsights";
import { calculateHealthScore, getGradeColor, getTrendColor, getTrendIcon } from "@/lib/health-score";
import { Progress } from "@/components/ui/progress";
import { exportToCSV } from "@/lib/export";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
  const [marketFilter, setMarketFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { from, to };
  });

  function setPreset(preset: "thisMonth" | "lastMonth" | "last3Months" | "thisYear") {
    const now = new Date();
    if (preset === "thisMonth") {
      setDateRange({
        from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    } else if (preset === "lastMonth") {
      setDateRange({
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
        to: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
      });
    } else if (preset === "last3Months") {
      setDateRange({
        from: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0],
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    } else if (preset === "thisYear") {
      setDateRange({
        from: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        to: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0],
      });
    }
  }

  const { data: clients = [], isLoading: l1 } = useClients();
  const { data: deliverables = [], isLoading: l2 } = useDeliverables();
  const { data: invoices = [], isLoading: l3 } = useInvoices();
  const { data: tasks = [], isLoading: l4 } = useTasks();

  const isLoading = l1 || l2 || l3 || l4;

  // Build a client-id → market lookup once so task filtering is O(1) not O(N*M)
  const clientMarketMap = useMemo(() =>
    new Map(clients.map((c) => [c.id, c.market])),
  [clients]);

  const filteredClients      = useMemo(() => marketFilter === "all" ? clients      : clients.filter((c) => c.market === marketFilter),      [clients, marketFilter]);
  const filteredDeliverables = useMemo(() => {
    let result = marketFilter === "all" ? deliverables : deliverables.filter((d) => d.market === marketFilter);
    // Filter by due date range
    result = result.filter((d) => {
      if (!d.dueDate) return true;
      return d.dueDate >= dateRange.from && d.dueDate <= dateRange.to;
    });
    return result;
  }, [deliverables, marketFilter, dateRange]);
  const filteredInvoices     = useMemo(() => {
    let result = marketFilter === "all" ? invoices : invoices.filter((i) => i.market === marketFilter);
    // Filter by month — invoice.month is YYYY-MM, compare with date range
    result = result.filter((i) => {
      if (!i.month) return true;
      const monthStart = i.month + "-01";
      return monthStart >= dateRange.from && monthStart <= dateRange.to;
    });
    return result;
  }, [invoices, marketFilter, dateRange]);
  const filteredTasks        = useMemo(() => {
    let result = marketFilter === "all" ? tasks : tasks.filter((t) => {
      if (!t.clientId) return false;
      return clientMarketMap.get(t.clientId) === marketFilter;
    });
    // Filter by due date range
    result = result.filter((t) => {
      if (!t.dueDate) return true;
      return t.dueDate >= dateRange.from && t.dueDate <= dateRange.to;
    });
    return result;
  }, [tasks, marketFilter, clientMarketMap, dateRange]);

  // Revenue by month
  const revenueChartData = useMemo(() => {
    const byMonth = filteredInvoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, inv) => { acc[inv.month] = (acc[inv.month] || 0) + inv.amount; return acc; }, {} as Record<string, number>);
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
  }, [filteredInvoices]);

  // Revenue by market
  const marketChartData = useMemo(() => {
    const byMarket = filteredInvoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, inv) => { acc[inv.market] = (acc[inv.market] || 0) + inv.amount; return acc; }, {} as Record<string, number>);
    return Object.entries(byMarket).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  // Deliverable status breakdown
  const delivChartData = useMemo(() => {
    const counts = filteredDeliverables.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredDeliverables]);

  // Client health scores
  const clientHealth = useMemo(() =>
    filteredClients
      .filter((c) => c.status === "Active")
      .map((c) => calculateHealthScore(c, deliverables, invoices, tasks))
      .sort((a, b) => a.score - b.score),
  [filteredClients, deliverables, invoices, tasks]);

  const healthColors: Record<string, string> = {
    Healthy: "bg-green-500/10 text-green-600",
    "At Risk": "bg-yellow-500/10 text-yellow-600",
    Critical: "bg-red-500/10 text-red-600",
  };

  // Summary stats
  const totalRevenue = useMemo(() =>
    filteredInvoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0),
  [filteredInvoices]);
  const completionRate = useMemo(() => filteredDeliverables.length > 0
    ? Math.round((filteredDeliverables.filter((d) => d.status === "Delivered" || d.status === "Approved").length / filteredDeliverables.length) * 100)
    : 0, [filteredDeliverables]);
  const taskCompletionRate = useMemo(() => filteredTasks.length > 0
    ? Math.round((filteredTasks.filter((t) => t.status === "Done").length / filteredTasks.length) * 100)
    : 0, [filteredTasks]);

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Reporting Dashboard</h1>
          <p className="text-muted-foreground">Revenue, performance, and client health analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range presets */}
          <div className="flex gap-1">
            {[
              { label: "This Month", preset: "thisMonth" as const },
              { label: "Last Month", preset: "lastMonth" as const },
              { label: "Last 3M", preset: "last3Months" as const },
              { label: "This Year", preset: "thisYear" as const },
            ].map(({ label, preset }) => (
              <Button key={preset} variant="outline" size="sm" className="text-xs h-8" onClick={() => setPreset(preset)}>
                {label}
              </Button>
            ))}
          </div>
          {/* Date range inputs */}
          <div className="flex items-center gap-1.5">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">From</Label>
            <Input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} className="w-auto h-8 text-sm" />
            <Label className="text-sm text-muted-foreground whitespace-nowrap">To</Label>
            <Input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} className="w-auto h-8 text-sm" />
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
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filteredInvoices.map(i => ({
            ID: i.invoiceId,
            Client: i.clientName ?? "",
            Month: i.month,
            Amount: i.amount,
            Currency: i.currency,
            Status: i.status,
            Services: i.servicesBilled,
          })), `report-${dateRange.from}-to-${dateRange.to}`)}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      <ReportInsights
        clients={filteredClients}
        deliverables={filteredDeliverables}
        invoices={filteredInvoices}
        tasks={filteredTasks as any}
      />

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
                <div key={ch.clientId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border ${getGradeColor(ch.grade)}`}>
                      {ch.grade}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{ch.companyName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ch.factors.map((f) => (
                          <span key={f.name} className="text-[10px] text-muted-foreground">
                            {f.name}: {f.score}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-sm font-mono font-bold ${getTrendColor(ch.trend)}`}>
                        {ch.score} {getTrendIcon(ch.trend)}
                      </span>
                      <p className="text-xs text-muted-foreground">${ch.monthlyValue}/mo</p>
                    </div>
                    <Badge variant="outline">{ch.market}</Badge>
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
