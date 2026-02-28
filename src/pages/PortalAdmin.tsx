import { useState, useEffect } from "react";
import { usePortalAccessList, useCreatePortalAccess, useTogglePortalAccess, useDeletePortalAccess } from "@/hooks/use-portal";
import { useClients } from "@/hooks/use-clients";
import { useUnreadPortalMessageCounts, usePortalMessages, useSendPortalMessage, useMarkMessagesRead } from "@/hooks/use-portal-messages";
import { useClientOnboarding } from "@/hooks/use-onboarding";
import { usePortalFiles, useUploadPortalFile, useDeletePortalFile, formatFileSize } from "@/hooks/use-portal-files";
import { usePortalTeamMembers } from "@/hooks/use-portal-team";
import { useWorkspaceSettings } from "@/hooks/use-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ExternalLink, Copy, Trash2, Globe, Mail, Check, MessageSquare, FileText, Paperclip, Upload, Download, File, Send, CheckCheck, Users, Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PortalAccess, ClientOnboarding } from "@/types";
import { toast } from "sonner";

function buildPortalUrl(token: string) {
  return `${window.location.origin}/portal?token=${token}`;
}

function buildMailtoLink(email: string, contactName: string, clientName: string, portalUrl: string, agencyName = "Agency") {
  const subject = encodeURIComponent(`Your ${agencyName} Client Portal Access`);
  const body = encodeURIComponent(
    `Hi ${contactName},\n\n` +
    `You have been granted access to the ${clientName} project dashboard on ${agencyName}.\n\n` +
    `Click the link below to access your portal:\n${portalUrl}\n\n` +
    `You can bookmark this link for future access. If you have any questions, feel free to reply to this email.\n\n` +
    `Best regards,\n${agencyName} Team`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

// Component to manage files for a client portal (agency side)
function FilesDialog({ portalAccessId, clientName }: { portalAccessId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const { data: files = [], isLoading } = usePortalFiles(open ? portalAccessId : undefined);
  const uploadFile = useUploadPortalFile();
  const deleteFile = useDeletePortalFile();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Manage files">
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Files — {clientName}</DialogTitle>
          <DialogDescription>Upload and manage files shared with this client.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Upload */}
          <label className="cursor-pointer block">
            <input
              type="file"
              className="hidden"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                picked.forEach((f) =>
                  uploadFile.mutate({ portalAccessId, file: f, uploadedBy: "agency" })
                );
                e.target.value = "";
              }}
            />
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
              <Upload className="h-4 w-4" />
              {uploadFile.isPending ? "Uploading..." : "Click to upload files for this client"}
            </div>
          </label>

          {/* File list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-4">No files yet.</p>
          ) : (
            <div className="rounded-lg border divide-y">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.fileName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        f.uploadedBy === "agency"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {f.uploadedBy === "agency" ? "Agency" : "Client"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" download={f.fileName}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteFile.mutate({ id: f.id, portalAccessId, fileUrl: f.fileUrl })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component to view a client's onboarding brief in a dialog
function ClientBriefDialog({ portalAccessId, clientName }: { portalAccessId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const { data: brief, isLoading } = useClientOnboarding(open ? portalAccessId : undefined);

  const statusLabel = !brief ? "Not started" : !brief.completedAt ? `In progress (step ${brief.currentStep}/6)` : "Complete";
  const statusColor = !brief ? "secondary" : !brief.completedAt ? "outline" : "default";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="View client brief">
          <FileText className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Brief — {clientName}</DialogTitle>
          <DialogDescription>
            Onboarding information submitted by the client.{" "}
            <Badge variant={statusColor as "default" | "secondary" | "outline"}>{statusLabel}</Badge>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !brief ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            The client hasn't started their onboarding yet.
          </p>
        ) : (
          <div className="space-y-6 mt-4">
            {/* About */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">About the Business</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {brief.industry && (
                  <div><p className="text-xs text-muted-foreground">Industry</p><p className="font-medium">{brief.industry}</p></div>
                )}
                {brief.websiteUrl && (
                  <div><p className="text-xs text-muted-foreground">Website</p>
                    <a href={brief.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate block">{brief.websiteUrl}</a>
                  </div>
                )}
                {brief.businessDescription && (
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">What they do</p><p>{brief.businessDescription}</p></div>
                )}
                {brief.targetAudience && (
                  <div className="col-span-2"><p className="text-xs text-muted-foreground">Target Audience</p><p>{brief.targetAudience}</p></div>
                )}
              </div>
            </section>

            {/* Brand */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Brand Identity</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(brief.primaryColor || brief.secondaryColor) && (
                  <div className="col-span-2 flex items-center gap-4">
                    {brief.primaryColor && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded border" style={{ background: brief.primaryColor }} />
                        <span className="text-xs font-mono">{brief.primaryColor}</span>
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                    )}
                    {brief.secondaryColor && (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded border" style={{ background: brief.secondaryColor }} />
                        <span className="text-xs font-mono">{brief.secondaryColor}</span>
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      </div>
                    )}
                  </div>
                )}
                {brief.fontPreferences && (
                  <div><p className="text-xs text-muted-foreground">Font Preferences</p><p>{brief.fontPreferences}</p></div>
                )}
                {brief.brandVoice && (
                  <div><p className="text-xs text-muted-foreground">Brand Voice</p>
                    <Badge variant="outline">{brief.brandVoice}</Badge>
                  </div>
                )}
                {brief.brandDos && (
                  <div><p className="text-xs text-muted-foreground">Do's ✅</p><p className="text-xs whitespace-pre-wrap">{brief.brandDos}</p></div>
                )}
                {brief.brandDonts && (
                  <div><p className="text-xs text-muted-foreground">Don'ts ❌</p><p className="text-xs whitespace-pre-wrap">{brief.brandDonts}</p></div>
                )}
              </div>
            </section>

            {/* Competitors */}
            {brief.competitors && brief.competitors.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Competitors</h3>
                <div className="space-y-2">
                  {brief.competitors.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{c.name}</span>
                        {c.url && (
                          <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{c.url}</a>
                        )}
                      </div>
                      {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Goals */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Goals & Expectations</h3>
              <div className="space-y-3 text-sm">
                {brief.goals && (
                  <div><p className="text-xs text-muted-foreground">Main Goals</p><p>{brief.goals}</p></div>
                )}
                {(brief.priority1 || brief.priority2 || brief.priority3) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Top Priorities</p>
                    <div className="space-y-1">
                      {brief.priority1 && <p className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">#1</span>{brief.priority1}</p>}
                      {brief.priority2 && <p className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">#2</span>{brief.priority2}</p>}
                      {brief.priority3 && <p className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">#3</span>{brief.priority3}</p>}
                    </div>
                  </div>
                )}
                {brief.communicationStyle && (
                  <div><p className="text-xs text-muted-foreground">Preferred Communication</p>
                    <Badge variant="outline">{brief.communicationStyle}</Badge>
                  </div>
                )}
                {brief.additionalNotes && (
                  <div><p className="text-xs text-muted-foreground">Additional Notes</p><p className="text-xs whitespace-pre-wrap">{brief.additionalNotes}</p></div>
                )}
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function MessagesDialog({
  clientId,
  clientName,
  unreadCount,
}: {
  clientId: string;
  clientName: string;
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { data: workspace } = useWorkspaceSettings();
  const { data: messages = [], isLoading } = usePortalMessages(open ? clientId : undefined);
  const sendMessage = useSendPortalMessage();
  const markRead = useMarkMessagesRead();

  // Mark client messages as read when dialog opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markRead.mutate({ clientId, senderType: "client" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage.mutate(
      { clientId, senderType: "agency", senderName: workspace?.agencyName ?? "Agency", message: text, clientName },
      { onSuccess: () => setText("") }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="Messages">
          <MessageSquare className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Messages — {clientName}</DialogTitle>
          <DialogDescription>Chat thread with this client contact.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 max-h-72 space-y-3 py-2 pr-1">
          {isLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => <div key={i} className="h-12 rounded bg-muted animate-pulse" />)}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderType === "agency" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${msg.senderType === "agency" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium opacity-80">{msg.senderName}</span>
                    <span className="text-[10px] opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  {msg.senderType === "agency" && (
                    <div className="flex justify-end mt-0.5">
                      <span className={`text-[10px] flex items-center gap-0.5 ${msg.isRead ? "opacity-100" : "opacity-40"}`}>
                        <CheckCheck className="h-3 w-3" />
                        {msg.isRead ? "Seen" : "Sent"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 border-t pt-3 mt-auto">
          <Textarea
            placeholder="Type a message..."
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button onClick={handleSend} disabled={!text.trim() || sendMessage.isPending} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamDialog({
  portalAccessId,
  accessToken,
  clientName,
}: {
  portalAccessId: string;
  accessToken: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: members = [], isLoading } = usePortalTeamMembers(open ? portalAccessId : undefined);

  const buildInviteUrl = (inviteToken: string) =>
    `${window.location.origin}/portal?token=${accessToken}&member=${inviteToken}`;

  const activeCount = members.filter((m) => m.acceptedAt).length;
  const totalCount = members.length;

  function memberTimeAgo(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="Team members">
          <Users className="h-3.5 w-3.5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] text-white flex items-center justify-center font-bold">
              {totalCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Members — {clientName}</DialogTitle>
          <DialogDescription>
            {totalCount === 0
              ? "No team members invited yet."
              : `${activeCount} active · ${totalCount - activeCount} pending`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 mt-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-14 rounded bg-muted animate-pulse" />)}
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            The client hasn't invited any team members yet.
          </p>
        ) : (
          <div className="rounded-lg border divide-y mt-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{m.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{m.email}</span>
                    {m.acceptedAt ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> Pending
                      </span>
                    )}
                    {m.lastSeenAt && (
                      <span className="text-[10px] text-muted-foreground">Last seen {memberTimeAgo(m.lastSeenAt)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  title="Copy invite link"
                  onClick={() => {
                    navigator.clipboard.writeText(buildInviteUrl(m.inviteToken));
                    toast.success("Invite link copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function PortalAdmin() {
  const { data: workspace } = useWorkspaceSettings();
  const agencyName = workspace?.agencyName ?? "Agency";
  const { data: accesses = [], isLoading } = usePortalAccessList();
  const { data: clients = [] } = useClients();
  const { data: unreadCounts = {} } = useUnreadPortalMessageCounts();
  const createMutation = useCreatePortalAccess();
  const toggleMutation = useTogglePortalAccess();
  const deleteMutation = useDeletePortalAccess();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [deleteAccess, setDeleteAccess] = useState<PortalAccess | null>(null);
  const [createdAccess, setCreatedAccess] = useState<{ token: string; contactName: string; contactEmail: string; clientName: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const existingClientIds = accesses.map((a) => a.clientId);
  const availableClients = clients.filter((c) => !existingClientIds.includes(c.id));

  const getClientName = (clientId: string) =>
    clients.find((c) => c.id === clientId)?.companyName || "Unknown";

  const handleCreate = () => {
    if (!selectedClientId || !contactEmail || !contactName) return;
    const clientName = getClientName(selectedClientId);
    createMutation.mutate(
      { clientId: selectedClientId, contactEmail, contactName, isActive: true },
      {
        onSuccess: (data) => {
          setCreateOpen(false);
          setCreatedAccess({ token: data.accessToken, contactName, contactEmail, clientName });
          setLinkCopied(false);
          setSelectedClientId("");
          setContactEmail("");
          setContactName("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteAccess) return;
    deleteMutation.mutate(deleteAccess.id, { onSuccess: () => setDeleteAccess(null) });
  };

  const copyPortalLink = (token: string) => {
    navigator.clipboard.writeText(buildPortalUrl(token));
    toast.success("Portal link copied to clipboard");
  };

  const sendInviteEmail = (access: PortalAccess) => {
    const clientName = getClientName(access.clientId);
    const portalUrl = buildPortalUrl(access.accessToken);
    window.open(buildMailtoLink(access.contactEmail, access.contactName, clientName, portalUrl, agencyName), "_blank");
    toast.success(`Opening email to ${access.contactEmail}`);
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Client Portal Management</h1>
        <div className="space-y-2">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            Client Portal Management
            {totalUnread > 0 && (
              <Badge className="bg-destructive text-xs">{totalUnread} unread</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Manage external client access to their project dashboards</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Grant Access</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Portal Access</DialogTitle>
              <DialogDescription>Grant a client contact access to their portal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                  <SelectContent>
                    {availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input placeholder="John Doe" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input type="email" placeholder="john@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!selectedClientId || !contactEmail || !contactName || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create & Send Access"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success dialog */}
      <Dialog open={!!createdAccess} onOpenChange={(open) => !open && setCreatedAccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Portal Access Created</DialogTitle>
            <DialogDescription>Share the portal link with the client contact.</DialogDescription>
          </DialogHeader>
          {createdAccess && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Access created for <span className="font-medium text-foreground">{createdAccess.contactName}</span> ({createdAccess.clientName}).
              </p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Portal Link</Label>
                <div className="flex gap-2">
                  <Input readOnly value={buildPortalUrl(createdAccess.token)} className="text-xs font-mono" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(buildPortalUrl(createdAccess.token));
                      setLinkCopied(true);
                      toast.success("Link copied!");
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                  >
                    {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const portalUrl = buildPortalUrl(createdAccess.token);
                  window.open(buildMailtoLink(createdAccess.contactEmail, createdAccess.contactName, createdAccess.clientName, portalUrl, agencyName), "_blank");
                  toast.success(`Opening email to ${createdAccess.contactEmail}`);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email to {createdAccess.contactName}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setCreatedAccess(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Portals</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{accesses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            <ExternalLink className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{accesses.filter((a) => a.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{totalUnread}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Last Accessed</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accesses.map((access) => {
              const clientName = getClientName(access.clientId);
              const unread = unreadCounts[access.clientId] || 0;
              return (
                <TableRow key={access.id} className={unread > 0 ? "bg-destructive/5" : ""}>
                  <TableCell className="font-medium">{clientName}</TableCell>
                  <TableCell>{access.contactName}</TableCell>
                  <TableCell className="text-sm">{access.contactEmail}</TableCell>
                  <TableCell>
                    {access.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <MessagesDialog clientId={access.clientId} clientName={clientName} unreadCount={unread} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {access.lastAccessedAt ? timeAgo(access.lastAccessedAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FilesDialog portalAccessId={access.id} clientName={clientName} />
                      <ClientBriefDialog portalAccessId={access.id} clientName={clientName} />
                      <TeamDialog portalAccessId={access.id} accessToken={access.accessToken} clientName={clientName} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Send invite email" onClick={() => sendInviteEmail(access)}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Copy portal link" onClick={() => copyPortalLink(access.accessToken)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Switch
                        checked={access.isActive}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: access.id, isActive: checked })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteAccess(access)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {accesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={Globe}
                    title="No client portals yet"
                    description="Grant a client contact access to their dedicated project portal to share updates, files, and messages."
                    actionLabel="Grant Access"
                    onAction={() => setCreateOpen(true)}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAccess} onOpenChange={(open) => !open && setDeleteAccess(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Portal Access</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke portal access for {deleteAccess?.contactName}. They will no longer be able to view their dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
