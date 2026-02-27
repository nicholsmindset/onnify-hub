import { useState } from "react";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/use-invoices";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Invoice, InvoiceStatus } from "@/types";
import { InvoiceFormValues } from "@/lib/validations";

const statusColor: Record<InvoiceStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/10 text-primary",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useInvoices({ status: statusFilter, market: marketFilter });
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

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
      },
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (data: InvoiceFormValues) => {
    if (!editInvoice) return;
    updateMutation.mutate(
      { id: editInvoice.id, ...data },
      { onSuccess: () => setEditInvoice(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteInvoice) return;
    deleteMutation.mutate(deleteInvoice.id, {
      onSuccess: () => setDeleteInvoice(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Invoice & Revenue</h1>
          <p className="text-muted-foreground">Track invoices and revenue across markets</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Invoice</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Invoice</DialogTitle>
              <DialogDescription>Fill in the invoice details below.</DialogDescription>
            </DialogHeader>
            <InvoiceForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
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
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">{inv.invoiceId}</TableCell>
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditInvoice(inv)}>
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
            <div className="mt-6">
              <InvoiceForm
                defaultValues={editInvoice}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
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
    </div>
  );
}
