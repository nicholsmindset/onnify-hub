import { useState } from "react";
import { usePortalAccessList, useCreatePortalAccess, useTogglePortalAccess, useDeletePortalAccess } from "@/hooks/use-portal";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ExternalLink, Copy, Trash2, Globe, Mail, Check } from "lucide-react";
import { PortalAccess } from "@/types";
import { toast } from "sonner";

function buildPortalUrl(token: string) {
  return `${window.location.origin}/portal?token=${token}`;
}

function buildMailtoLink(email: string, contactName: string, clientName: string, portalUrl: string) {
  const subject = encodeURIComponent(`Your ONNIFY WORKS Client Portal Access`);
  const body = encodeURIComponent(
    `Hi ${contactName},\n\n` +
    `You have been granted access to the ${clientName} project dashboard on ONNIFY WORKS.\n\n` +
    `Click the link below to access your portal:\n${portalUrl}\n\n` +
    `You can bookmark this link for future access. If you have any questions, feel free to reply to this email.\n\n` +
    `Best regards,\nONNIFY WORKS Team`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function PortalAdmin() {
  const { data: accesses = [], isLoading } = usePortalAccessList();
  const { data: clients = [] } = useClients();
  const createMutation = useCreatePortalAccess();
  const toggleMutation = useTogglePortalAccess();
  const deleteMutation = useDeletePortalAccess();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [deleteAccess, setDeleteAccess] = useState<PortalAccess | null>(null);

  // State for the "access created" success dialog
  const [createdAccess, setCreatedAccess] = useState<{ token: string; contactName: string; contactEmail: string; clientName: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const existingClientIds = accesses.map((a) => a.clientId);
  const availableClients = clients.filter((c) => !existingClientIds.includes(c.id));

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.companyName || "Unknown";
  };

  const handleCreate = () => {
    if (!selectedClientId || !contactEmail || !contactName) return;
    const clientName = getClientName(selectedClientId);
    createMutation.mutate(
      { clientId: selectedClientId, contactEmail, contactName, isActive: true },
      {
        onSuccess: (data) => {
          setCreateOpen(false);
          // Show the success dialog with portal link
          setCreatedAccess({
            token: data.accessToken,
            contactName,
            contactEmail,
            clientName,
          });
          setLinkCopied(false);
          // Reset create form
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
    const url = buildPortalUrl(token);
    navigator.clipboard.writeText(url);
    toast.success("Portal link copied to clipboard");
  };

  const sendInviteEmail = (access: PortalAccess) => {
    const clientName = getClientName(access.clientId);
    const portalUrl = buildPortalUrl(access.accessToken);
    const mailto = buildMailtoLink(access.contactEmail, access.contactName, clientName, portalUrl);
    window.open(mailto, "_blank");
    toast.success(`Opening email to ${access.contactEmail}`);
  };

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
          <h1 className="text-2xl font-display font-bold">Client Portal Management</h1>
          <p className="text-muted-foreground">Manage external client access to their project dashboards</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Grant Access</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Portal Access</DialogTitle>
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

      {/* Success dialog - shown after creating portal access */}
      <Dialog open={!!createdAccess} onOpenChange={(open) => !open && setCreatedAccess(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Portal Access Created</DialogTitle>
          </DialogHeader>
          {createdAccess && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Access has been created for <span className="font-medium text-foreground">{createdAccess.contactName}</span> ({createdAccess.clientName}).
                Share the portal link below with the client.
              </p>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Portal Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={buildPortalUrl(createdAccess.token)}
                    className="text-xs font-mono"
                  />
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
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const portalUrl = buildPortalUrl(createdAccess.token);
                    const mailto = buildMailtoLink(createdAccess.contactEmail, createdAccess.contactName, createdAccess.clientName, portalUrl);
                    window.open(mailto, "_blank");
                    toast.success(`Opening email to ${createdAccess.contactEmail}`);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email to {createdAccess.contactName}
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setCreatedAccess(null)}>
                Done
              </Button>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Disabled</CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{accesses.filter((a) => !a.isActive).length}</div>
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
              <TableHead>Last Accessed</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accesses.map((access) => (
              <TableRow key={access.id}>
                <TableCell className="font-medium">{getClientName(access.clientId)}</TableCell>
                <TableCell>{access.contactName}</TableCell>
                <TableCell className="text-sm">{access.contactEmail}</TableCell>
                <TableCell>
                  {access.isActive ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {access.lastAccessedAt ? new Date(access.lastAccessedAt).toLocaleDateString() : "Never"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
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
            ))}
            {accesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No portal accesses created yet. Grant access to a client to generate their portal link.
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
