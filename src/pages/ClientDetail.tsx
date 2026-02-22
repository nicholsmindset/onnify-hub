import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useClient } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Building2, User, Sparkles } from "lucide-react";
import { ClientStatus, DeliverableStatus, InvoiceStatus } from "@/types";
import { EmailComposer } from "@/components/ai/EmailComposer";
import { Progress } from "@/components/ui/progress";
import { calculateHealthScore, getGradeColor, getTrendColor, getTrendIcon } from "@/lib/health-score";

const statusColor: Record<ClientStatus, string> = {
  Prospect: "bg-muted text-muted-foreground",
  Onboarding: "bg-warning/10 text-warning",
  Active: "bg-success/10 text-success",
  Churned: "bg-destructive/10 text-destructive",
};

const deliverableStatusColor: Record<DeliverableStatus, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-primary/10 text-primary",
  "Review": "bg-warning/10 text-warning",
  "Delivered": "bg-success/10 text-success",
  "Approved": "bg-accent/10 text-accent",
};

const invoiceStatusColor: Record<InvoiceStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/10 text-primary",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading: loadingClient } = useClient(id);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables({ clientId: id });
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({ clientId: id });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ clientId: id });

  if (loadingClient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Link to="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
          </Button>
        </Link>
        <p className="text-muted-foreground">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/clients">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
        </Button>
      </Link>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-display">{client.companyName}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{client.clientId}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor[client.status]}`}>
              {client.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium">{client.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{client.market}</Badge>
              <div>
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="text-sm font-medium">{client.planTier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">{client.primaryContact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Monthly Value</p>
                <p className="text-sm font-medium font-mono">${client.monthlyValue}</p>
              </div>
            </div>
          </div>
          {(client.contractStart || client.contractEnd) && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Contract: {client.contractStart || "—"} to {client.contractEnd || "Ongoing"}
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {client.ghlUrl && (
              <a href={client.ghlUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in GoHighLevel
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => setEmailComposerOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 mr-2" /> Draft Email with AI
            </Button>
          </div>
        </CardContent>
      </Card>

      <EmailComposer open={emailComposerOpen} onOpenChange={setEmailComposerOpen} client={client} />

      {/* Health Score Card */}
      {client.status === "Active" && (() => {
        const health = calculateHealthScore(client, deliverables, invoices, tasks);
        return (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Client Health Score</CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold border ${getGradeColor(health.grade)}`}>
                    {health.grade}
                  </span>
                  <span className={`text-lg font-mono font-bold ${getTrendColor(health.trend)}`}>
                    {health.score}/100 {getTrendIcon(health.trend)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {health.factors.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{f.name}</span>
                      <span className="text-xs font-mono font-medium">{f.score}%</span>
                    </div>
                    <Progress value={f.score} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">{f.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Tabs: Deliverables, Invoices, Tasks */}
      <Tabs defaultValue="deliverables">
        <TabsList>
          <TabsTrigger value="deliverables">
            Deliverables ({deliverables.length})
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deliverables" className="mt-4">
          {loadingDeliverables ? (
            <Skeleton className="h-32 w-full" />
          ) : deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No deliverables yet</p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliverables.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{d.serviceType}</Badge></TableCell>
                      <TableCell className="text-sm">{d.assignedTo}</TableCell>
                      <TableCell className="text-sm">{d.priority}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deliverableStatusColor[d.status]}`}>
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{d.dueDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {loadingInvoices ? (
            <Skeleton className="h-32 w-full" />
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoiceId}</TableCell>
                      <TableCell>{inv.month}</TableCell>
                      <TableCell className="text-sm">{inv.servicesBilled}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${invoiceStatusColor[inv.status]}`}>
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inv.currency === "IDR" ? `Rp${inv.amount.toLocaleString()}` : `$${inv.amount.toLocaleString()}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          {loadingTasks ? (
            <Skeleton className="h-32 w-full" />
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet</p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{t.category}</Badge></TableCell>
                      <TableCell className="text-sm">{t.assignedTo}</TableCell>
                      <TableCell className="text-sm">{t.status}</TableCell>
                      <TableCell className="text-sm">{t.dueDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
