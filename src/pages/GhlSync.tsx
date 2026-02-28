import { useState } from "react";
import { useGhlConnections, useCreateGhlConnection, useUpdateGhlConnection, useDeleteGhlConnection, useTriggerSync } from "@/hooks/use-ghl";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Unplug, Plug, Trash2, AlertTriangle, Link2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { GhlConnection, GhlSyncStatus } from "@/types";

const statusConfig: Record<GhlSyncStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  connected: { label: "Connected", variant: "default" },
  disconnected: { label: "Disconnected", variant: "secondary" },
  syncing: { label: "Syncing...", variant: "outline" },
  error: { label: "Error", variant: "destructive" },
};

export default function GhlSync() {
  const { data: connections = [], isLoading } = useGhlConnections();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateGhlConnection();
  const updateMutation = useUpdateGhlConnection();
  const deleteMutation = useDeleteGhlConnection();
  const syncMutation = useTriggerSync();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [locationId, setLocationId] = useState("");
  const [deleteConn, setDeleteConn] = useState<GhlConnection | null>(null);

  const connectedClientIds = connections.map((c) => c.clientId);
  const availableClients = clients.filter((c) => !connectedClientIds.includes(c.id));

  const handleCreate = () => {
    if (!selectedClientId) return;
    createMutation.mutate(
      {
        clientId: selectedClientId,
        apiKey: apiKey || undefined,
        locationId: locationId || undefined,
        syncEnabled: false,
        syncStatus: "disconnected",
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setSelectedClientId("");
          setApiKey("");
          setLocationId("");
        },
      }
    );
  };

  const handleToggleSync = (conn: GhlConnection) => {
    updateMutation.mutate({ id: conn.id, syncEnabled: !conn.syncEnabled });
  };

  const handleDelete = () => {
    if (!deleteConn) return;
    deleteMutation.mutate(deleteConn.id, { onSuccess: () => setDeleteConn(null) });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">GoHighLevel Sync</h1>
          <p className="text-muted-foreground">Manage CRM pipeline connections</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">GoHighLevel Sync</h1>
          <p className="text-muted-foreground">{connections.length} client connections configured</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Connect Client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Client to GHL</DialogTitle>
              <DialogDescription>Link a client to their GoHighLevel account.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                  <SelectContent>
                    {availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.companyName} ({c.market})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>GHL API Key</Label>
                <Input type="password" placeholder="Enter API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location ID</Label>
                <Input placeholder="Enter location ID" value={locationId} onChange={(e) => setLocationId(e.target.value)} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={!selectedClientId || createMutation.isPending}>
                {createMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Connections</CardTitle>
            <Plug className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">{connections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacts Synced</CardTitle>
            <RefreshCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {connections.reduce((sum, c) => sum + c.contactsSynced, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Syncs</CardTitle>
            <Unplug className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold">
              {connections.filter((c) => c.syncEnabled).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((conn) => {
          const config = statusConfig[conn.syncStatus];
          return (
            <Card key={conn.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{conn.clientName || "Unknown Client"}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{conn.displayClientId}</p>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {conn.market && <Badge variant="outline">{conn.market}</Badge>}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Contacts</p>
                    <p className="font-medium">{conn.contactsSynced}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Pipelines</p>
                    <p className="font-medium">{conn.pipelinesSynced}</p>
                  </div>
                </div>

                {conn.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(conn.lastSyncAt).toLocaleString()}
                  </p>
                )}

                {conn.errorMessage && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    {conn.errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={conn.syncEnabled} onCheckedChange={() => handleToggleSync(conn)} />
                    <span className="text-sm">Auto-sync</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate(conn.id)}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                      Sync
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConn(conn)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {connections.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Link2}
              title="No GHL connections yet"
              description="Connect a client to their GoHighLevel account to start syncing contacts and pipeline data."
              actionLabel="Connect Client"
              onAction={() => setCreateOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConn} onOpenChange={(open) => !open && setDeleteConn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the GHL connection for {deleteConn?.clientName}? Sync history will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
