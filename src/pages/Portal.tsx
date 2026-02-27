import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePortalAccessByToken } from "@/hooks/use-portal";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { useClient } from "@/hooks/use-clients";
import { usePortalMessages, useSendPortalMessage, useMarkMessagesRead } from "@/hooks/use-portal-messages";
import { useClientOnboarding } from "@/hooks/use-onboarding";
import { OnboardingWizard } from "@/components/portal/OnboardingWizard";
import { useUpdateDeliverable } from "@/hooks/use-deliverables";
import { usePortalFiles, useUploadPortalFile, useDeletePortalFile, formatFileSize } from "@/hooks/use-portal-files";
import {
  usePortalTeamMembers, useInviteTeamMember, useRemoveTeamMember,
  useValidateInviteToken, useUpdateMemberLastSeen,
} from "@/hooks/use-portal-team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  FileCheck, Receipt, ListTodo, LogIn, Building2,
  CheckCircle, XCircle, MessageSquare, Send, ThumbsUp,
  ExternalLink, Circle, Paperclip, Upload, Download, Trash2, File, Phone,
  Users, UserPlus, Copy, Check, Clock,
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

// Kanban column config
const KANBAN_COLUMNS: Array<{ title: string; statuses: DeliverableStatus[]; accent: string; dot: string }> = [
  { title: "Not Started", statuses: ["Not Started"], accent: "border-muted-foreground/30", dot: "bg-muted-foreground" },
  { title: "In Progress", statuses: ["In Progress"], accent: "border-blue-400", dot: "bg-blue-500" },
  { title: "In Review", statuses: ["Review"], accent: "border-yellow-400", dot: "bg-yellow-500" },
  { title: "Done", statuses: ["Delivered", "Approved"], accent: "border-green-400", dot: "bg-green-500" },
];

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
  compact = false,
}: {
  deliverable: Deliverable;
  contactName: string;
  clientId: string;
  compact?: boolean;
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

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    sendMessage.mutate(
      {
        clientId,
        deliverableId: deliverable.id,
        senderType: "client",
        senderName: contactName,
        message: `Feedback on "${deliverable.name}": ${feedback}`,
      },
      {
        onSuccess: () => {
          toast.success("Feedback sent");
          setFeedback("");
          setShowFeedback(false);
        },
      }
    );
  };

  const canApprove = deliverable.status === "Delivered" && !deliverable.clientApproved;

  return (
    <Card className={compact ? "shadow-none" : ""}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className={`font-medium ${compact ? "text-xs" : "text-sm"} truncate`}>{deliverable.name}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {!compact && (
                <Badge variant="outline" className="text-[10px] h-4">{deliverable.serviceType}</Badge>
              )}
              {deliverable.clientApproved && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle className="h-3 w-3" /> Approved
                </span>
              )}
              {deliverable.status === "Delivered" && !deliverable.clientApproved && (
                <span className="text-[10px] text-yellow-600 font-medium">Awaiting approval</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">Due {deliverable.dueDate}</p>
          </div>
          {deliverable.fileLink && (
            <a href={deliverable.fileLink} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </div>

        {!compact && (
          <>
            <div className="flex gap-2 mt-3">
              {canApprove && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleApprove}
                  disabled={updateDeliverable.isPending}
                >
                  <ThumbsUp className="h-3 w-3" />
                  Approve
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setShowFeedback(!showFeedback)}
              >
                <MessageSquare className="h-3 w-3" />
                {canApprove ? "Request Changes" : "Comment"}
              </Button>
            </div>

            {showFeedback && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Leave a comment or request changes..."
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
                      onClick={handleSendFeedback}
                      disabled={sendMessage.isPending || !feedback.trim()}
                    >
                      <XCircle className="h-3 w-3" /> Request Changes
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handleSendFeedback}
                    disabled={sendMessage.isPending || !feedback.trim()}
                  >
                    <Send className="h-3 w-3" /> Send
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function KanbanBoard({
  deliverables,
  contactName,
  clientId,
}: {
  deliverables: Deliverable[];
  contactName: string;
  clientId: string;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {KANBAN_COLUMNS.map((col) => {
        const items = deliverables.filter((d) => col.statuses.includes(d.status));
        return (
          <div key={col.title} className={`rounded-lg border-t-2 bg-muted/30 p-3 space-y-2 ${col.accent}`}>
            <div className="flex items-center gap-2">
              <Circle className={`h-2 w-2 ${col.dot} rounded-full fill-current`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col.title}</span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">No items</p>
              ) : (
                items.map((d) => (
                  <DeliverableCard key={d.id} deliverable={d} contactName={contactName} clientId={clientId} compact />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
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

function WhatsNew({
  messages,
  files,
}: {
  messages: Array<{ id: string; senderType: string; senderName: string; message: string; createdAt: string }>;
  files: Array<{ id: string; uploadedBy: string; fileName: string; createdAt: string }>;
}) {
  type FeedItem = { key: string; text: string; kind: "message" | "file"; date: string };
  const items: FeedItem[] = [
    ...messages
      .filter((m) => m.senderType === "agency")
      .map((m) => ({
        key: `msg-${m.id}`,
        text: `${m.senderName} sent you a message`,
        kind: "message" as const,
        date: m.createdAt,
      })),
    ...files
      .filter((f) => f.uploadedBy === "agency")
      .map((f) => ({
        key: `file-${f.id}`,
        text: `Your team shared "${f.fileName}"`,
        kind: "file" as const,
        date: f.createdAt,
      })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold">What's New</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-1">
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 px-4 py-2.5">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                {item.kind === "message" ? (
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.text}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TeamTab({
  portalAccessId,
  accessToken,
}: {
  portalAccessId: string;
  accessToken: string;
}) {
  const { data: members = [], isLoading } = usePortalTeamMembers(portalAccessId);
  const inviteMember = useInviteTeamMember();
  const removeMember = useRemoveTeamMember();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const buildInviteUrl = (inviteToken: string) =>
    `${window.location.origin}/portal?token=${accessToken}&member=${inviteToken}`;

  const copyInviteLink = (member: ReturnType<typeof usePortalTeamMembers>["data"][0]) => {
    if (!member) return;
    navigator.clipboard.writeText(buildInviteUrl(member.inviteToken));
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInvite = () => {
    if (!name.trim() || !email.trim()) return;
    inviteMember.mutate(
      { portalAccessId, name: name.trim(), email: email.trim() },
      {
        onSuccess: () => {
          setName("");
          setEmail("");
        },
      }
    );
  };

  if (isLoading) {
    return <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Invite a Team Member
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            They'll get a unique link to access this portal.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            className="w-full gap-2"
            onClick={handleInvite}
            disabled={!name.trim() || !email.trim() || inviteMember.isPending}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {inviteMember.isPending ? "Creating invite..." : "Generate Invite Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Team list */}
      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No team members invited yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-muted-foreground">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{m.email}</span>
                  {m.acceptedAt ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Copy invite link"
                  onClick={() => copyInviteLink(m)}
                >
                  {copiedId === m.id ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  title="Remove member"
                  onClick={() => removeMember.mutate({ id: m.id, portalAccessId })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PortalDashboard({
  clientId,
  contactName,
  portalAccessId,
  accessToken,
  memberToken,
}: {
  clientId: string;
  contactName: string;
  portalAccessId: string;
  accessToken: string;
  memberToken?: string;
}) {
  const { data: client, isLoading: loadingClient } = useClient(clientId);
  const { data: deliverables = [], isLoading: loadingDeliverables } = useDeliverables({ clientId });
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({ clientId });
  const { data: tasks = [], isLoading: loadingTasks } = useTasks({ clientId });
  const { data: messages = [] } = usePortalMessages(clientId);
  const { data: onboarding, isLoading: loadingOnboarding } = useClientOnboarding(portalAccessId);
  const { data: files = [] } = usePortalFiles(portalAccessId);
  const uploadFile = useUploadPortalFile();
  const deleteFile = useDeletePortalFile();
  const sendMessage = useSendPortalMessage();
  const markRead = useMarkMessagesRead();
  const updateLastSeen = useUpdateMemberLastSeen();

  // Resolve member context when a member token is present
  const { data: activeMember } = useValidateInviteToken(memberToken);

  // The display name: member's name if in member context, otherwise the contact name
  const displayName = activeMember?.name || contactName;
  const isOwner = !memberToken; // owner = no member token in URL

  // Update member's last_seen_at on portal load
  useEffect(() => {
    if (activeMember?.id) {
      updateLastSeen.mutate(activeMember.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMember?.id]);

  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState("deliverables");
  const [onboardingDone, setOnboardingDone] = useState(false);

  const isLoading = loadingClient || loadingDeliverables || loadingInvoices || loadingTasks;

  // Count unread messages from agency
  const unreadFromAgency = messages.filter((m) => m.senderType === "agency" && !m.isRead).length;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "messages" && unreadFromAgency > 0) {
      markRead.mutate({ clientId, senderType: "agency" });
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage.mutate(
      {
        clientId,
        senderType: "client",
        senderName: displayName,
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

  // Show onboarding wizard fullscreen until completed (only for owner, not team members)
  const showWizard = isOwner && !loadingOnboarding && !onboarding?.completedAt && !onboardingDone;
  if (showWizard) {
    return (
      <OnboardingWizard
        portalAccessId={portalAccessId}
        contactName={displayName}
        onComplete={() => setOnboardingDone(true)}
      />
    );
  }

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
      <header className="border-b bg-card sticky top-0 z-10">
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{client?.companyName}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">({displayName})</span>
              {!isOwner && (
                <Badge variant="outline" className="text-xs">Team Member</Badge>
              )}
            </div>
            <a
              href={`mailto:team@onnify.com?subject=${encodeURIComponent(`Meeting Request – ${client?.companyName ?? ""}`)}&body=${encodeURIComponent(`Hi,\n\nI'd like to schedule a call to discuss the ${client?.companyName ?? ""} project.\n\nPlease let me know your availability.\n\nBest,\n${contactName}`)}`}
            >
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Phone className="h-3 w-3" />
                Request a Call
              </Button>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Welcome / onboarding complete banner */}
        {onboardingDone && (
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="py-3">
              <p className="text-sm font-medium text-green-700">
                Welcome! Your onboarding brief has been submitted. Your team will review it shortly.
              </p>
            </CardContent>
          </Card>
        )}

        {/* What's New feed */}
        <WhatsNew messages={messages} files={files} />

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
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="deliverables">
              Deliverables {deliverables.length > 0 && `(${deliverables.length})`}
            </TabsTrigger>
            <TabsTrigger value="invoices">
              Invoices {invoices.length > 0 && `(${invoices.length})`}
            </TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="files" className="gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              Files {files.length > 0 && `(${files.length})`}
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
              {unreadFromAgency > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadFromAgency}
                </span>
              )}
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="team" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                Team
              </TabsTrigger>
            )}
          </TabsList>

          {/* Deliverables — Phase 3 Kanban board */}
          <TabsContent value="deliverables" className="mt-4">
            {deliverables.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliverables yet</p>
            ) : (
              <div className="space-y-4">
                {/* Awaiting approval callout */}
                {deliverables.some((d) => d.status === "Delivered" && !d.clientApproved) && (
                  <Card className="border-yellow-400/50 bg-yellow-500/5">
                    <CardContent className="py-3">
                      <p className="text-sm font-medium text-yellow-700">
                        You have {deliverables.filter((d) => d.status === "Delivered" && !d.clientApproved).length} deliverable(s) awaiting your approval.
                        Review them in the "Done" column below.
                      </p>
                    </CardContent>
                  </Card>
                )}
                <KanbanBoard deliverables={deliverables} contactName={contactName} clientId={clientId} />
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
                      <TableCell>{inv.paymentDate || "—"}</TableCell>
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

          {/* Files Tab */}
          <TabsContent value="files" className="mt-4">
            <div className="space-y-4">
              {/* Upload button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Share files with your ONNIFY WORKS team.
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      picked.forEach((f) =>
                        uploadFile.mutate({ portalAccessId, file: f, uploadedBy: "client" })
                      );
                      e.target.value = "";
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadFile.isPending ? "Uploading..." : "Upload Files"}
                  </span>
                </label>
              </div>

              {/* File list */}
              {files.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Paperclip className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No files yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload files to share with your team.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-card divide-y">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                      <File className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.fileName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            f.uploadedBy === "agency"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {f.uploadedBy === "agency" ? "ONNIFY" : "You"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" download={f.fileName}>
                          <button className="p-1.5 rounded hover:bg-muted transition-colors">
                            <Download className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </a>
                        {f.uploadedBy === "client" && (
                          <button
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            onClick={() => deleteFile.mutate({ id: f.id, portalAccessId, fileUrl: f.fileUrl })}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Team Tab — owner only */}
          {isOwner && (
            <TabsContent value="team" className="mt-4">
              <TeamTab portalAccessId={portalAccessId} accessToken={accessToken} />
            </TabsContent>
          )}

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            <Card>
              <CardContent className="p-4 space-y-4">
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
                        </div>
                      </div>
                    ))
                  )}
                </div>

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
  const memberParam = searchParams.get("member") || undefined;
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

  return (
    <PortalDashboard
      clientId={access.clientId}
      contactName={access.contactName}
      portalAccessId={access.id}
      accessToken={access.accessToken}
      memberToken={memberParam}
    />
  );
}
