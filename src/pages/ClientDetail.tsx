import { useParams, Link, useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useRetainerUsage } from "@/hooks/use-retainer";
import { useClientReports } from "@/hooks/use-client-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Building2, User, Rocket, Globe, FileText } from "lucide-react";
import { ClientStatus, DeliverableStatus, InvoiceStatus } from "@/types";

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
  const navigate = useNavigate();
  const { data: client, isLoading: loadingClient } = useClient(id);
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables({ clientId: id });
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({ clientId: id });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ clientId: id });
  const { data: onboarding } = useOnboarding(id);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: retainerUsage } = useRetainerUsage(id, currentMonth);
  const { data: reports = [] } = useClientReports(id);

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
          {client.ghlUrl && (
            <div className="mt-4">
              <a href={client.ghlUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in GoHighLevel
                </Button>
              </a>
            </div>
          )}
          {client.primaryLanguage && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              {client.primaryLanguage}{client.secondaryLanguage ? ` / ${client.secondaryLanguage}` : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Banner */}
      {client.onboardingStatus !== "complete" && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-sm">
                  {onboarding ? `Onboarding in progress — ${onboarding.status.replace(/_/g, " ")}` : "Client hasn't been onboarded yet"}
                </p>
                <p className="text-xs text-muted-foreground">Complete onboarding to unlock the full content workflow</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(`/clients/${id}/onboarding`)}>
              {onboarding ? "Continue Onboarding" : "Start Onboarding"}
            </Button>
          </CardContent>
        </Card>
      )}

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
          <TabsTrigger value="retainer">Retainer</TabsTrigger>
          <TabsTrigger value="reports">
            Reports ({reports.length})
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

        <TabsContent value="retainer" className="mt-4">
          {retainerUsage ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retainer Usage — {currentMonth}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Blogs", used: retainerUsage.blogsUsed },
                  { label: "Service Pages", used: retainerUsage.servicePagesUsed },
                  { label: "pSEO Pages", used: retainerUsage.pseoPagesUsed },
                  { label: "Social Cascades", used: retainerUsage.socialCascadesUsed },
                  { label: "Email Sequences", used: retainerUsage.emailSequencesUsed },
                  { label: "Case Studies", used: retainerUsage.caseStudiesUsed },
                ].filter(item => item.used > 0).map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="font-mono">{item.used} used</span>
                    </div>
                    <Progress value={Math.min(item.used * 10, 100)} className="h-2" />
                  </div>
                ))}
                {retainerUsage.blogsUsed === 0 && retainerUsage.servicePagesUsed === 0 && retainerUsage.socialCascadesUsed === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No retainer usage recorded this month</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">No retainer usage data for this month</p>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No reports generated yet</p>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.reportId}</TableCell>
                      <TableCell>{r.month}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "published" ? "default" : "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[300px] truncate">{r.summary || "—"}</TableCell>
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
