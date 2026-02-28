import { useState } from "react";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice, useGenerateRecurringInvoice } from "@/hooks/use-invoices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Plus, Pencil, Trash2, Download, FileDown, RefreshCw, Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Invoice, InvoiceStatus } from "@/types";
import { InvoiceFormValues } from "@/lib/validations";
import { exportToCSV, exportInvoicePDF } from "@/lib/export";

const statusColor: Record<InvoiceStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/10 text-primary",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
};

interface RecurringState {
  isRecurring: boolean;
  recurrenceInterval: string;
}

const defaultRecurring: RecurringState = { isRecurring: false, recurrenceInterval: "monthly" };

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createRecurring, setCreateRecurring] = useState<RecurringState>(defaultRecurring);
  const [editRecurring, setEditRecurring] = useState<RecurringState>(defaultRecurring);

  const { data: invoices = [], isLoading } = useInvoices({ status: statusFilter, market: marketFilter });
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();
  const generateRecurringMutation = useGenerateRecurringInvoice();

  const totalByCurrency = invoices.reduce((acc, inv) => {
    if (inv.status === "Paid" || inv.status === "Sent") {
      acc[inv.currency] = (acc[inv.currency] || 0) + inv.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleCreate = (data: InvoiceFormValues) => {
    createMutation.mutate(
      {
        clientId: data.clientId,
        month: data.month,
        amount: data.amount,
        currency: data.currency,
        servicesBilled: data.servicesBilled,
        status: data.status,
        paymentDate: data.paymentDate || undefined,
        market: data.market,
        invoiceId: "INV-TMP",
        isRecurring: createRecurring.isRecurring,
        recurrenceInterval: createRecurring.isRecurring ? createRecurring.recurrenceInterval : null,
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          setCreateRecurring(defaultRecurring);
        },
      }
    );
  };

  const handleUpdate = (data: InvoiceFormValues) => {
    if (!editInvoice) return;
    updateMutation.mutate(
      {
        id: editInvoice.id,
        ...data,
        isRecurring: editRecurring.isRecurring,
        recurrenceInterval: editRecurring.isRecurring ? editRecurring.recurrenceInterval : null,
      },
      { onSuccess: () => setEditInvoice(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteInvoice) return;
    deleteMutation.mutate(deleteInvoice.id, {
      onSuccess: () => setDeleteInvoice(null),
    });
  };

  function openEdit(inv: Invoice) {
    setEditInvoice(inv);
    setEditRecurring({
      isRecurring: inv.isRecurring ?? false,
      recurrenceInterval: inv.recurrenceInterval ?? "monthly",
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map(i => i.id)));
    }
  }

  const selectedInvoices = invoices.filter(i => selectedIds.has(i.id));

  function handleBulkExport() {
    exportToCSV(
      selectedInvoices.map(inv => ({
        ID: inv.invoiceId,
        Client: inv.clientName ?? "",
        Amount: inv.amount,
        Currency: inv.currency,
        Status: inv.status,
        "Due Date": inv.paymentDate ?? "",
      })),
      "invoices-selected"
    );
  }

  function handleBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} invoice(s)? This cannot be undone.`)) return;
    const ids = [...selectedIds];
    Promise.all(ids.map(id => deleteMutation.mutateAsync(id))).then(() => {
      setSelectedIds(new Set());
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Invoice & Revenue</h1>
          <p className="text-muted-foreground">Track invoices and revenue across markets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(invoices.map(inv => ({
            ID: inv.invoiceId,
            Client: inv.clientName ?? "",
            Amount: inv.amount,
            Currency: inv.currency,
            Status: inv.status,
            Month: inv.month,
            Services: inv.servicesBilled,
          })), "invoices")}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setCreateRecurring(defaultRecurring); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Invoice</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Invoice</DialogTitle>
                <DialogDescription>Fill in the invoice details below.</DialogDescription>
              </DialogHeader>
              <InvoiceForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
              {/* Recurring controls — outside the InvoiceForm to keep form logic clean */}
              <div className="space-y-3 border-t pt-4 mt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Recurring Invoice</Label>
                  <Switch
                    checked={createRecurring.isRecurring}
                    onCheckedChange={v => setCreateRecurring(r => ({ ...r, isRecurring: v }))}
                  />
                </div>
                {createRecurring.isRecurring && (
                  <div className="space-y-1">
                    <Label className="text-sm">Recurrence</Label>
                    <Select
                      value={createRecurring.recurrenceInterval}
                      onValueChange={v => setCreateRecurring(r => ({ ...r, recurrenceInterval: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Revenue Summary */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(totalByCurrency).map(([currency, total]) => (
            <Card key={currency}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Revenue ({currency})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-display font-bold">
                  {currency === "IDR" ? `Rp${total.toLocaleString()}` : `$${total.toLocaleString()}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={marketFilter} onValueChange={setMarketFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Market" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
            <SelectItem value="ID">Indonesia</SelectItem>
            <SelectItem value="US">USA</SelectItem>
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
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={invoices.length > 0 && selectedIds.size === invoices.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={Receipt}
                      title="No invoices yet"
                      description="Create your first invoice to start billing clients and tracking payments."
                    />
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((inv) => (
                <TableRow key={inv.id} className={selectedIds.has(inv.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(inv.id)}
                      onCheckedChange={() => toggleSelect(inv.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <div className="flex items-center gap-1.5">
                      {inv.invoiceId}
                      {inv.isRecurring && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0 gap-0.5">
                          <RefreshCw className="h-2.5 w-2.5" /> {inv.recurrenceInterval}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{inv.clientName}</TableCell>
                  <TableCell>{inv.month}</TableCell>
                  <TableCell className="text-sm">{inv.servicesBilled}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[inv.status]}`}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {inv.currency === "IDR" ? `Rp${inv.amount.toLocaleString()}` : `$${inv.amount.toLocaleString()}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Export PDF"
                        onClick={() => exportInvoicePDF({
                          invoiceId: inv.invoiceId,
                          clientName: inv.clientName,
                          amount: inv.amount,
                          currency: inv.currency,
                          status: inv.status,
                          dueDate: inv.paymentDate,
                        })}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>
                      {inv.isRecurring && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          title="Generate next invoice"
                          onClick={() => generateRecurringMutation.mutate(inv)}
                          disabled={generateRecurringMutation.isPending}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(inv)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteInvoice(inv)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editInvoice} onOpenChange={(open) => !open && setEditInvoice(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Invoice</SheetTitle>
          </SheetHeader>
          {editInvoice && (
            <div className="mt-6 space-y-4">
              <InvoiceForm
                defaultValues={editInvoice}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Recurring Invoice</Label>
                  <Switch
                    checked={editRecurring.isRecurring}
                    onCheckedChange={v => setEditRecurring(r => ({ ...r, isRecurring: v }))}
                  />
                </div>
                {editRecurring.isRecurring && (
                  <div className="space-y-1">
                    <Label className="text-sm">Recurrence</Label>
                    <Select
                      value={editRecurring.recurrenceInterval}
                      onValueChange={v => setEditRecurring(r => ({ ...r, recurrenceInterval: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={(open) => !open && setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deleteInvoice?.invoiceId}? This action cannot be undone.
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

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            label: "Export Selected",
            icon: <Download className="h-3.5 w-3.5 mr-1.5" />,
            onClick: handleBulkExport,
            variant: "outline",
          },
          {
            label: "Delete Selected",
            icon: <Trash2 className="h-3.5 w-3.5 mr-1.5" />,
            onClick: handleBulkDelete,
            variant: "destructive",
          },
        ]}
      />
    </div>
  );
}

