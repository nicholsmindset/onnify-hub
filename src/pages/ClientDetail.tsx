import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useClient } from "@/hooks/use-clients";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/use-contacts";
import { usePortalMessages, useSendPortalMessage } from "@/hooks/use-portal-messages";
import { useTimeEntries, useDeleteTimeEntry } from "@/hooks/use-time-entries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ExternalLink, Calendar, DollarSign, Building2, User, Sparkles, Plus, Pencil, Trash2, Phone, Mail, Star, MessageSquare, Send, Clock } from "lucide-react";
import { ClientStatus, DeliverableStatus, InvoiceStatus, Contact, ContactRole } from "@/types";
import { EmailComposer } from "@/components/ai/EmailComposer";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Progress } from "@/components/ui/progress";
import { calculateHealthScore, getGradeColor, getTrendColor, getTrendIcon } from "@/lib/health-score";

const contactRoleLabels: Record<ContactRole, string> = {
  primary: "Primary",
  marketing: "Marketing",
  finance: "Finance",
  executive: "Executive",
  technical: "Technical",
  other: "Other",
};

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
  const { data: contacts = [], isLoading: loadingContacts } = useContacts(id);
  const { data: portalMessages = [] } = usePortalMessages(id);
  const sendPortalMessage = useSendPortalMessage();
  const { data: timeEntries = [] } = useTimeEntries({ clientId: id });
  const deleteTimeEntry = useDeleteTimeEntry();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [replyText, setReplyText] = useState("");
  // Contact form state
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cRole, setCRole] = useState<ContactRole>("other");
  const [cTitle, setCTitle] = useState("");
  const [cIsPrimary, setCIsPrimary] = useState(false);
  const [cNotes, setCNotes] = useState("");

  const resetContactForm = () => {
    setCName(""); setCEmail(""); setCPhone(""); setCRole("other");
    setCTitle(""); setCIsPrimary(false); setCNotes("");
  };

  const loadContactForm = (c: Contact) => {
    setCName(c.name); setCEmail(c.email || ""); setCPhone(c.phone || "");
    setCRole(c.role); setCTitle(c.title || ""); setCIsPrimary(c.isPrimary);
    setCNotes(c.notes || "");
  };

  const handleSaveContact = () => {
    const payload = {
      clientId: id!, name: cName, email: cEmail || undefined, phone: cPhone || undefined,
      role: cRole, title: cTitle || undefined, isPrimary: cIsPrimary, notes: cNotes || undefined,
    };
    if (editingContact) {
      updateContact.mutate({ id: editingContact.id, ...payload }, {
        onSuccess: () => { setEditingContact(null); setContactDialogOpen(false); resetContactForm(); },
      });
    } else {
      createContact.mutate(payload, {
        onSuccess: () => { setContactDialogOpen(false); resetContactForm(); },
      });
    }
  };

  const handleDeleteContact = () => {
    if (!deleteContactTarget) return;
    deleteContact.mutate(deleteContactTarget.id, { onSuccess: () => setDeleteContactTarget(null) });
  };
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
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEmailComposerOpen(true)}>
              <Sparkles className="h-3.5 w-3.5 mr-2" /> Draft Email with AI
            </Button>
            {client.ghlUrl && (
              <a href={client.ghlUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> Open in GoHighLevel
                </Button>
              </a>
            )}
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
          <TabsTrigger value="contacts">
            Contacts ({contacts.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            Activity
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Messages {portalMessages.length > 0 && `(${portalMessages.length})`}
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            Time {timeEntries.length > 0 && `(${timeEntries.length})`}
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

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-4">
          {loadingContacts ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={contactDialogOpen} onOpenChange={(open) => { setContactDialogOpen(open); if (!open) { setEditingContact(null); resetContactForm(); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Contact</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
                      <DialogDescription>{editingContact ? "Update this contact's details." : "Add a new contact for this client."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Full name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={cRole} onValueChange={(v) => setCRole(v as ContactRole)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(contactRoleLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@company.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="+65 ..." />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="e.g. Marketing Director" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input value={cNotes} onChange={(e) => setCNotes(e.target.value)} placeholder="Optional notes" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="isPrimary" checked={cIsPrimary} onChange={(e) => setCIsPrimary(e.target.checked)} className="rounded" />
                        <Label htmlFor="isPrimary" className="text-sm">Primary contact</Label>
                      </div>
                      <Button className="w-full" onClick={handleSaveContact}
                        disabled={!cName || (editingContact ? updateContact.isPending : createContact.isPending)}>
                        {(editingContact ? updateContact.isPending : createContact.isPending) ? "Saving..." : editingContact ? "Update" : "Add Contact"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No contacts yet. Add your first contact for this client.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {contacts.map((contact) => (
                    <Card key={contact.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                              <span className="text-primary-foreground font-bold text-xs">
                                {contact.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{contact.name}</p>
                                {contact.isPrimary && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                              </div>
                              {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                              <Badge variant="outline" className="text-[10px] mt-1">{contactRoleLabels[contact.role]}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                              loadContactForm(contact); setEditingContact(contact); setContactDialogOpen(true);
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteContactTarget(contact)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {contact.phone}
                            </div>
                          )}
                          {contact.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">{contact.notes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          {id && <ActivityTimeline clientId={id} />}
        </TabsContent>

        {/* Messages Tab - Portal Communication */}
        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Client Portal Messages</CardTitle>
              <p className="text-xs text-muted-foreground">Messages from the client portal. Reply below to communicate with the client.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-96 overflow-y-auto space-y-3">
                {portalMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-sm">No portal messages yet</p>
                ) : (
                  portalMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === "agency" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 ${
                          msg.senderType === "agency"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium opacity-80">{msg.senderName}</span>
                          <Badge variant="outline" className="text-[10px] h-4 opacity-70">
                            {msg.senderType === "client" ? "Client" : "Team"}
                          </Badge>
                          <span className="text-[10px] opacity-60 ml-auto">
                            {new Date(msg.createdAt).toLocaleDateString()}{" "}
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 border-t pt-3">
                <Textarea
                  placeholder="Reply to client..."
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!replyText.trim() || !id) return;
                      sendPortalMessage.mutate(
                        { clientId: id, senderType: "agency", senderName: "ONNIFY WORKS Team", message: replyText },
                        { onSuccess: () => setReplyText("") }
                      );
                    }
                  }}
                />
                <Button
                  className="self-end"
                  onClick={() => {
                    if (!replyText.trim() || !id) return;
                    sendPortalMessage.mutate(
                      { clientId: id, senderType: "agency", senderName: "ONNIFY WORKS Team", message: replyText },
                      { onSuccess: () => setReplyText("") }
                    );
                  }}
                  disabled={!replyText.trim() || sendPortalMessage.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tab */}
        <TabsContent value="time" className="mt-4">
          {timeEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No time entries yet for this client.</p>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Total Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-mono font-bold">
                      {timeEntries.reduce((sum, e) => sum + e.hours, 0).toFixed(1)}h
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Billable Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-mono font-bold">
                      {timeEntries.filter((e) => e.isBillable).reduce((sum, e) => sum + e.hours, 0).toFixed(1)}h
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Billable Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-mono font-bold">
                      ${timeEntries
                        .filter((e) => e.isBillable && e.hourlyRate)
                        .reduce((sum, e) => sum + e.hours * (e.hourlyRate ?? 0), 0)
                        .toFixed(0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead>Linked To</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Billable</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm font-mono">{entry.date}</TableCell>
                        <TableCell className="text-sm">{entry.teamMember}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{entry.hours.toFixed(1)}h</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {entry.taskId ? "Task" : entry.deliverableId ? "Deliverable" : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                          {entry.notes ?? "—"}
                        </TableCell>
                        <TableCell>
                          {entry.isBillable ? (
                            <Badge className="text-xs bg-success/10 text-success border-0">Billable</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Non-billable</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteTimeEntry.mutate(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Contact Confirmation */}
      <AlertDialog open={!!deleteContactTarget} onOpenChange={(open) => !open && setDeleteContactTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteContactTarget?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
