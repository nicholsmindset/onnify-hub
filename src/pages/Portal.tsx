import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePortalAccessByToken } from "@/hooks/use-portal";
import { useDeliverables, useUpdateDeliverable } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useClient } from "@/hooks/use-clients";
import { usePortalMessages, useSendPortalMessage } from "@/hooks/use-portal-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  FileCheck, Receipt, ListTodo, LogIn, Building2,
  CheckCircle, XCircle, MessageSquare, Send, ThumbsUp,
  ExternalLink,
} from "lucide-react";
import { Deliverable, DeliverableStatus, InvoiceStatus } from "@/types";
import { toast } from "sonner";

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

function DeliverableCard({
  deliverable,
  contactName,
  clientId,
}: {
  deliverable: Deliverable;
  contactName: string;
  clientId: string;
}) {
  const updateDeliverable = useUpdateDeliverable();
  const sendMessage = useSendPortalMessage();
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const handleApprove = () => {
    updateDeliverable.mutate(
      { id: deliverable.id, clientApproved: true, status: "Approved" as DeliverableStatus },
      {
        onSuccess: () => {
          toast.success(`"${deliverable.name}" approved!`);
          sendMessage.mutate({
            clientId,
            deliverableId: deliverable.id,
            senderType: "client",
            senderName: contactName,
            message: `Approved deliverable: ${deliverable.name}`,
          });
        },
      }
    );
  };

  const handleRequestChanges = () => {
    if (!feedback.trim()) {
      toast.error("Please describe the changes you'd like");
      return;
    }
    sendMessage.mutate(
      {
        clientId,
        deliverableId: deliverable.id,
        senderType: "client",
        senderName: contactName,
        message: `Requested changes on "${deliverable.name}": ${feedback}`,
      },
      {
        onSuccess: () => {
          toast.success("Feedback sent to the team");
          setFeedback("");
          setShowFeedback(false);
        },
      }
    );
  };

  const handleSendComment = () => {
    if (!feedback.trim()) return;
    sendMessage.mutate(
      {
        clientId,
        deliverableId: deliverable.id,
        senderType: "client",
        senderName: contactName,
        message: feedback,
      },
      {
        onSuccess: () => {
          toast.success("Comment sent");
          setFeedback("");
          setShowFeedback(false);
        },
      }
    );
  };

  const canApprove = deliverable.status === "Delivered" && !deliverable.clientApproved;
  const canComment = deliverable.status !== "Not Started";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium text-sm">{deliverable.name}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{deliverable.serviceType}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${delivStatusColor[deliverable.status]}`}>
                {deliverable.status}
              </span>
            </div>
            {deliverable.description && (
              <p className="text-xs text-muted-foreground mt-1">{deliverable.description}</p>
            )}
            <p className="text-xs text-muted-foreground">Due: {deliverable.dueDate}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {deliverable.clientApproved ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle className="h-3 w-3 mr-1" /> Approved
              </Badge>
            ) : deliverable.status === "Delivered" ? (
              <Badge variant="outline" className="text-yellow-600 border-yellow-500/20">
                Awaiting Approval
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                {deliverable.status}
              </Badge>
            )}
            {deliverable.fileLink && (
              <a href={deliverable.fileLink} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  <ExternalLink className="h-3 w-3" /> View File
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {canApprove && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleApprove}
              disabled={updateDeliverable.isPending}
            >
              <ThumbsUp className="h-3 w-3" />
              {updateDeliverable.isPending ? "Approving..." : "Approve"}
            </Button>
          )}
          {canComment && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              <MessageSquare className="h-3 w-3" />
              {canApprove ? "Request Changes" : "Add Comment"}
            </Button>
          )}
        </div>

        {/* Feedback / comment input */}
        {showFeedback && (
          <div className="mt-3 space-y-2">
            <Textarea
              placeholder={canApprove ? "Describe the changes you'd like..." : "Leave a comment..."}
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              {canApprove && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs gap-1"
                  onClick={handleRequestChanges}
                  disabled={sendMessage.isPending || !feedback.trim()}
                >
                  <XCircle className="h-3 w-3" /> Request Changes
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleSendComment}
                disabled={sendMessage.isPending || !feedback.trim()}
              >
                <Send className="h-3 w-3" /> Send Comment
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PortalDashboard({ clientId, contactName }: { clientId: string; contactName: string }) {
  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables({ clientId });
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({ clientId });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ clientId });
  const { data: messages = [] } = usePortalMessages(clientId);
  const sendMessage = useSendPortalMessage();
  const [messageText, setMessageText] = useState("");

  const isLoading = loadingClient || loadingDeliverables || loadingInvoices || loadingTasks;

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(
      {
        clientId,
        senderType: "client",
        senderName: contactName,
        message: messageText,
      },
      {
        onSuccess: () => {
          setMessageText("");
          toast.success("Message sent");
        },
      }
    );
  };

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
  const approvedCount = deliverables.filter((d) => d.clientApproved).length;
  const completionRate = deliverables.length > 0
    ? Math.round((approvedCount / deliverables.length) * 100)
    : 0;

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
        {/* Welcome Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <p className="text-sm font-medium">Welcome back, {contactName}!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Here's an overview of your project with ONNIFY WORKS. You can approve deliverables, leave feedback, and communicate with your team directly from this portal.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Tasks</CardTitle>
              <ListTodo className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{tasks.filter((t) => t.status !== "Done").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="deliverables">
          <TabsList>
            <TabsTrigger value="deliverables">Deliverables ({deliverables.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages {messages.length > 0 && `(${messages.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Deliverables - Card layout with approve/feedback */}
          <TabsContent value="deliverables" className="mt-4">
            {deliverables.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliverables yet</p>
            ) : (
              <div className="space-y-3">
                {/* Pending approval section */}
                {deliverables.filter((d) => d.status === "Delivered" && !d.clientApproved).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-yellow-600 uppercase tracking-wider">Awaiting Your Approval</p>
                    {deliverables
                      .filter((d) => d.status === "Delivered" && !d.clientApproved)
                      .map((d) => (
                        <DeliverableCard key={d.id} deliverable={d} contactName={contactName} clientId={clientId} />
                      ))}
                  </div>
                )}

                {/* In progress section */}
                {deliverables.filter((d) => d.status !== "Delivered" && d.status !== "Approved").length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">In Progress</p>
                    {deliverables
                      .filter((d) => d.status !== "Delivered" && d.status !== "Approved")
                      .map((d) => (
                        <DeliverableCard key={d.id} deliverable={d} contactName={contactName} clientId={clientId} />
                      ))}
                  </div>
                )}

                {/* Completed section */}
                {deliverables.filter((d) => d.clientApproved).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider mt-4">Approved</p>
                    {deliverables
                      .filter((d) => d.clientApproved)
                      .map((d) => (
                        <DeliverableCard key={d.id} deliverable={d} contactName={contactName} clientId={clientId} />
                      ))}
                  </div>
                )}
              </div>
            )}
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

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Message thread */}
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No messages yet. Send a message to your ONNIFY WORKS team below.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === "client" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.senderType === "client"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium opacity-80">{msg.senderName}</span>
                            <span className="text-[10px] opacity-60">
                              {new Date(msg.createdAt).toLocaleDateString()}{" "}
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          {msg.deliverableId && (
                            <p className="text-[10px] mt-1 opacity-60">
                              Re: deliverable
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message input */}
                <div className="flex gap-2 border-t pt-3">
                  <Textarea
                    placeholder="Type a message to your ONNIFY WORKS team..."
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
