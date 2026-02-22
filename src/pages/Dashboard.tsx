import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useClients } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useContent } from "@/hooks/use-content";
import {
  Users, FileCheck, Receipt, ListTodo, AlertTriangle, TrendingUp,
  TrendingDown, ArrowRight, DollarSign, Clock, FileText, Zap,
  AlertCircle, Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { calculateHealthScore, getGradeColor, getTrendColor, getTrendIcon } from "@/lib/health-score";
import { buildActivityFeed, timeAgo } from "@/lib/activity";
import { SmartSuggestions } from "@/components/ai/SmartSuggestions";

const activityIcons = {
  deliverable: FileCheck,
  invoice: Receipt,
  task: ListTodo,
  content: FileText,
};

export default function Dashboard() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: content = [], isLoading: loadingContent } = useContent();

  const isLoading = loadingClients || loadingDeliverables || loadingInvoices || loadingTasks || loadingContent;

  const stats = useMemo(() => {
    if (isLoading) return null;

    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const activeClients = clients.filter((c) => c.status === "Active");
    const sgClients = activeClients.filter((c) => c.market === "SG").length;
    const idClients = activeClients.filter((c) => c.market === "ID").length;
    const usClients = activeClients.filter((c) => c.market === "US").length;

    const dueThisWeek = deliverables.filter((d) => {
      const due = new Date(d.dueDate);
      return due >= now && due <= weekFromNow && d.status !== "Delivered" && d.status !== "Approved";
    });

    const overdue = deliverables.filter((d) =>
      new Date(d.dueDate) < now && d.status !== "Delivered" && d.status !== "Approved"
    );

    const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
    const overdueInvoiceValue = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = now.getMonth() === 0
      ? `${now.getFullYear() - 1}-12`
      : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    const revenueThisMonth = invoices
      .filter((i) => i.month === currentMonth && (i.status === "Paid" || i.status === "Sent"))
      .reduce((sum, i) => sum + i.amount, 0);

    const revenueLastMonth = invoices
      .filter((i) => i.month === lastMonth && (i.status === "Paid" || i.status === "Sent"))
      .reduce((sum, i) => sum + i.amount, 0);

    const revenueTrend = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : 0;

    const openTasks = tasks.filter((t) => t.status !== "Done");
    const tasksByPerson = openTasks.reduce((acc, t) => {
      acc[t.assignedTo] = (acc[t.assignedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Content pipeline counts
    const contentByStatus = content.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Deliverable completion rate
    const delivCompleted = deliverables.filter((d) => d.status === "Delivered" || d.status === "Approved").length;
    const delivCompletionRate = deliverables.length > 0 ? Math.round((delivCompleted / deliverables.length) * 100) : 0;

    // Client health scores
    const healthScores = activeClients.map((c) =>
      calculateHealthScore(c, deliverables, invoices, tasks)
    ).sort((a, b) => a.score - b.score);

    // Contracts expiring within 30 days
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringContracts = clients.filter((c) => {
      if (!c.contractEnd || c.status === "Churned") return false;
      const end = new Date(c.contractEnd);
      return end >= now && end <= thirtyDaysFromNow;
    });

    // Activity feed
    const activityFeed = buildActivityFeed(deliverables, invoices, tasks, content, 8);

    return {
      activeClients, sgClients, idClients, usClients,
      dueThisWeek, overdue,
      overdueInvoices, overdueInvoiceValue,
      revenueThisMonth, revenueTrend,
      openTasks: openTasks.length, tasksByPerson,
      contentByStatus,
      delivCompletionRate,
      healthScores,
      expiringContracts,
      activityFeed,
    };
  }, [isLoading, clients, deliverables, invoices, tasks, content]);

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">ONNIFY WORKS operations overview</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const hasAlerts = stats.overdue.length > 0 || stats.overdueInvoices.length > 0 || stats.expiringContracts.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">ONNIFY WORKS operations overview</p>
      </div>

      {/* Smart Alert Banner */}
      {hasAlerts && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-semibold text-destructive">Action Required</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {stats.overdue.length > 0 && (
                <Link to="/deliverables">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 hover:bg-destructive/15 transition-colors cursor-pointer">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-sm font-medium">{stats.overdue.length} overdue deliverable{stats.overdue.length !== 1 ? "s" : ""}</span>
                  </div>
                </Link>
              )}
              {stats.overdueInvoices.length > 0 && (
                <Link to="/invoices">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 hover:bg-destructive/15 transition-colors cursor-pointer">
                    <DollarSign className="h-4 w-4 text-destructive flex-shrink-0" />
                    <span className="text-sm font-medium">${stats.overdueInvoiceValue.toLocaleString()} in overdue invoices</span>
                  </div>
                </Link>
              )}
              {stats.expiringContracts.length > 0 && (
                <Link to="/clients">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors cursor-pointer">
                    <Calendar className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm font-medium">{stats.expiringContracts.length} contract{stats.expiringContracts.length !== 1 ? "s" : ""} expiring soon</span>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/clients">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{stats.activeClients.length}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">SG {stats.sgClients}</Badge>
                <Badge variant="outline" className="text-xs">ID {stats.idClients}</Badge>
                <Badge variant="outline" className="text-xs">US {stats.usClients}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (This Month)</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">${stats.revenueThisMonth.toLocaleString()}</div>
              <div className="flex items-center gap-1 mt-1">
                {stats.revenueTrend > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : stats.revenueTrend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                ) : null}
                <span className={`text-xs ${stats.revenueTrend > 0 ? "text-green-500" : stats.revenueTrend < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {stats.revenueTrend > 0 ? "+" : ""}{stats.revenueTrend}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/deliverables">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{stats.delivCompletionRate}%</div>
              <Progress value={stats.delivCompletionRate} className="mt-2 h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{stats.dueThisWeek.length} due this week</p>
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
              <div className="text-3xl font-display font-bold">{stats.openTasks}</div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(stats.tasksByPerson).map(([name, count]) => (
                  <Badge key={name} variant="secondary" className="text-xs">{name}: {count}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Smart Task Suggestions */}
      <SmartSuggestions
        clients={clients}
        deliverables={deliverables}
        invoices={invoices}
        tasks={tasks}
        content={content}
      />

      {/* Middle Row: Client Health + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Client Health Scores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" /> Client Health Scores
            </CardTitle>
            <Link to="/reports">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.healthScores.length > 0 ? (
              <div className="space-y-2">
                {stats.healthScores.slice(0, 5).map((h) => (
                  <Link key={h.clientId} to={`/clients/${h.clientId}`}>
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold border ${getGradeColor(h.grade)}`}>
                          {h.grade}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{h.companyName}</p>
                          <p className="text-xs text-muted-foreground">{h.planTier} · ${h.monthlyValue}/mo</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono font-bold ${getTrendColor(h.trend)}`}>
                          {h.score}
                        </span>
                        <span className={`text-xs ${getTrendColor(h.trend)}`}>
                          {getTrendIcon(h.trend)}
                        </span>
                        <Badge variant="outline" className="text-xs">{h.market}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No active clients</p>
            )}
          </CardContent>
        </Card>

        {/* Content Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" /> Content Pipeline
            </CardTitle>
            <Link to="/content">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Open <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["Ideation", "Draft", "Review", "Approved", "Scheduled", "Published"].map((status) => {
                const count = stats.contentByStatus[status] || 0;
                const total = content.length || 1;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20">{status}</span>
                    <div className="flex-1">
                      <Progress value={(count / total) * 100} className="h-2" />
                    </div>
                    <span className="text-xs font-mono w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Due Items + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overdue + Due This Week */}
        <Card className={stats.overdue.length > 0 ? "border-destructive/30" : ""}>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            {stats.overdue.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-auto">{stats.overdue.length} overdue</Badge>
            )}
          </CardHeader>
          <CardContent>
            {stats.overdue.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {stats.overdue.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-destructive/5">
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.clientName} · {d.assignedTo}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs">Due {d.dueDate}</Badge>
                  </div>
                ))}
                {stats.overdue.length > 3 && (
                  <Link to="/deliverables">
                    <p className="text-xs text-destructive text-center cursor-pointer hover:underline">
                      +{stats.overdue.length - 3} more overdue
                    </p>
                  </Link>
                )}
              </div>
            )}
            {stats.dueThisWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All caught up!</p>
            ) : (
              <div className="space-y-1.5">
                {stats.dueThisWeek.slice(0, 5).map((d) => (
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

        {/* Activity Feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activityFeed.length > 0 ? (
              <div className="space-y-1">
                {stats.activityFeed.map((activity) => {
                  const Icon = activityIcons[activity.type];
                  return (
                    <div key={activity.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className="font-medium">{activity.action}</span>
                          {" "}{activity.title}
                        </p>
                        {activity.subtitle && (
                          <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(activity.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link to="/clients"><Button variant="outline" size="sm"><Users className="h-3.5 w-3.5 mr-1.5" /> Add Client</Button></Link>
            <Link to="/deliverables"><Button variant="outline" size="sm"><FileCheck className="h-3.5 w-3.5 mr-1.5" /> New Deliverable</Button></Link>
            <Link to="/invoices"><Button variant="outline" size="sm"><Receipt className="h-3.5 w-3.5 mr-1.5" /> Create Invoice</Button></Link>
            <Link to="/tasks"><Button variant="outline" size="sm"><ListTodo className="h-3.5 w-3.5 mr-1.5" /> Add Task</Button></Link>
            <Link to="/content"><Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5 mr-1.5" /> New Content</Button></Link>
            <Link to="/reports"><Button variant="outline" size="sm"><TrendingUp className="h-3.5 w-3.5 mr-1.5" /> View Reports</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
