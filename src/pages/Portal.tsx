import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePortalAccessByToken } from "@/hooks/use-portal";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useClient } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileCheck, Receipt, ListTodo, LogIn, Building2 } from "lucide-react";
import { DeliverableStatus, InvoiceStatus } from "@/types";

const delivStatusColor: Record<DeliverableStatus, string> = {
  "Not Started": "bg-muted text-muted-foreground",
  "In Progress": "bg-blue-500/10 text-blue-600",
  Review: "bg-yellow-500/10 text-yellow-600",
  Delivered: "bg-green-500/10 text-green-600",
  Approved: "bg-emerald-500/10 text-emerald-600",
};

const invStatusColor: Record<InvoiceStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-blue-500/10 text-blue-600",
  Paid: "bg-green-500/10 text-green-600",
  Overdue: "bg-red-500/10 text-red-600",
};

function PortalLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-lg">O</span>
          </div>
          <CardTitle className="text-2xl font-display">Client Portal</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">Enter your access token to view your project dashboard</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Enter your access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
            />
            <Button className="w-full" onClick={() => onLogin(token)} disabled={!token}>
              <LogIn className="h-4 w-4 mr-2" />
              Access Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PortalDashboard({ clientId, contactName }: { clientId: string; contactName: string }) {
  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables({ clientId });
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({ clientId });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ clientId });

  const isLoading = loadingClient || loadingDeliverables || loadingInvoices || loadingTasks;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeDeliverables = deliverables.filter((d) => d.status !== "Approved");
  const pendingInvoices = invoices.filter((i) => i.status !== "Paid");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">O</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-sm">ONNIFY WORKS</h1>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{client?.companyName}</span>
            <span className="text-xs text-muted-foreground">({contactName})</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deliverables</CardTitle>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{activeDeliverables.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Invoices</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{pendingInvoices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Related Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{tasks.filter((t) => t.status !== "Done").length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deliverables">
          <TabsList>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="deliverables" className="mt-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deliverable</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliverables.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.serviceType}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${delivStatusColor[d.status]}`}>{d.status}</span>
                      </TableCell>
                      <TableCell>{d.dueDate}</TableCell>
                      <TableCell>{d.clientApproved ? <Badge variant="default">Approved</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {deliverables.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No deliverables</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.invoiceId}</TableCell>
                      <TableCell>{inv.month}</TableCell>
                      <TableCell className="font-mono">{inv.currency} {inv.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${invStatusColor[inv.status]}`}>{inv.status}</span>
                      </TableCell>
                      <TableCell>{inv.paymentDate || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-4">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{t.status}</Badge></TableCell>
                      <TableCell>{t.dueDate}</TableCell>
                    </TableRow>
                  ))}
                  {tasks.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No tasks</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Portal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tokenParam = searchParams.get("token");
  const [enteredToken, setEnteredToken] = useState(tokenParam || "");

  const token = enteredToken || tokenParam || "";
  const { data: access, isLoading } = usePortalAccessByToken(token || undefined);

  const handleLogin = (t: string) => {
    setEnteredToken(t);
    setSearchParams({ token: t });
  };

  if (!token) {
    return <PortalLogin onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-lg font-medium text-destructive">Invalid or expired access token</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact your ONNIFY WORKS representative for a new link.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setEnteredToken(""); setSearchParams({}); }}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PortalDashboard clientId={access.clientId} contactName={access.contactName} />;
}
