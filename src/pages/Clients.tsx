import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/use-clients";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClientForm } from "@/components/forms/ClientForm";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Client, ClientStatus } from "@/types";
import { ClientFormValues } from "@/lib/validations";
import { useDeliverables } from "@/hooks/use-deliverables";
import { useInvoices } from "@/hooks/use-invoices";
import { useTasks } from "@/hooks/use-tasks";
import { calculateHealthScore, getGradeColor } from "@/lib/health-score";

const statusColor: Record<ClientStatus, string> = {
  Prospect: "bg-muted text-muted-foreground",
  Onboarding: "bg-warning/10 text-warning",
  Active: "bg-success/10 text-success",
  Churned: "bg-destructive/10 text-destructive",
};

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useClients({ market: marketFilter, status: statusFilter, search });
  const { data: allDeliverables = [] } = useDeliverables();
  const { data: allInvoices = [] } = useInvoices();
  const { data: allTasks = [] } = useTasks();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const healthScores = useMemo(() => clients.reduce((acc, c) => {
    if (c.status === "Active") {
      acc[c.id] = calculateHealthScore(c, allDeliverables, allInvoices, allTasks);
    }
    return acc;
  }, {} as Record<string, ReturnType<typeof calculateHealthScore>>), [clients, allDeliverables, allInvoices, allTasks]);

  const handleCreate = (data: ClientFormValues) => {
    createMutation.mutate(
      {
        companyName: data.companyName,
        market: data.market,
        industry: data.industry,
        planTier: data.planTier,
        status: data.status,
        primaryContact: data.primaryContact,
        contractStart: data.contractStart || undefined,
        contractEnd: data.contractEnd || undefined,
        monthlyValue: data.monthlyValue,
        ghlUrl: data.ghlUrl || undefined,
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (data: ClientFormValues) => {
    if (!editClient) return;
    updateMutation.mutate(
      { id: editClient.id, ...data },
      { onSuccess: () => setEditClient(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteClient) return;
    deleteMutation.mutate(deleteClient.id, {
      onSuccess: () => setDeleteClient(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Registry</h1>
          <p className="text-muted-foreground">{clients.length} clients across all markets</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Fill in the details to add a new client.</DialogDescription>
            </DialogHeader>
            <ClientForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Market" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
            <SelectItem value="ID">Indonesia</SelectItem>
            <SelectItem value="US">USA</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Prospect">Prospect</SelectItem>
            <SelectItem value="Onboarding">Onboarding</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Churned">Churned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Monthly Value</TableHead>
                <TableHead className="text-center">Health</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/clients/${client.id}`)}
                >
                  <TableCell className="font-mono text-xs">{client.clientId}</TableCell>
                  <TableCell className="font-medium">{client.companyName}</TableCell>
                  <TableCell><Badge variant="outline">{client.market}</Badge></TableCell>
                  <TableCell>{client.planTier}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[client.status]}`}>
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{client.primaryContact}</TableCell>
                  <TableCell className="text-right font-mono">${client.monthlyValue}</TableCell>
                  <TableCell className="text-center">
                    {healthScores[client.id] ? (
                      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border ${getGradeColor(healthScores[client.id].grade)}`}>
                        {healthScores[client.id].grade}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditClient(client)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteClient(client)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No clients found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Client</SheetTitle>
          </SheetHeader>
          {editClient && (
            <div className="mt-6">
              <ClientForm
                defaultValues={editClient}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteClient} onOpenChange={(open) => !open && setDeleteClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteClient?.companyName}? This will also delete all associated deliverables, invoices, and tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
