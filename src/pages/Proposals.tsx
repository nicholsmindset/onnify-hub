import { useState } from "react";
import {
  useProposals,
  useCreateProposal,
  useUpdateProposal,
  useDeleteProposal,
  useUpdateProposalStatus,
} from "@/hooks/use-proposals";
import { useClients } from "@/hooks/use-clients";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Pencil, Trash2, FileText, ChevronDown, PlusCircle, X } from "lucide-react";
import { Proposal, ProposalSection, ProposalStatus } from "@/types";

// ---------------------------------------------------------------------------
// Status badge helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  viewed: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  accepted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500",
  declined: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
};

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

// ---------------------------------------------------------------------------
// Sections builder (used in both create and edit dialogs)
// ---------------------------------------------------------------------------

interface SectionsEditorProps {
  sections: ProposalSection[];
  onChange: (sections: ProposalSection[]) => void;
}

function SectionsEditor({ sections, onChange }: SectionsEditorProps) {
  const updateSection = (sIdx: number, partial: Partial<ProposalSection>) => {
    const updated = sections.map((s, i) => (i === sIdx ? { ...s, ...partial } : s));
    onChange(updated);
  };

  const removeSection = (sIdx: number) => {
    onChange(sections.filter((_, i) => i !== sIdx));
  };

  const addSection = () => {
    onChange([...sections, { title: "", items: [{ name: "", qty: 1, rate: 0 }] }]);
  };

  const updateItem = (
    sIdx: number,
    iIdx: number,
    field: "name" | "qty" | "rate",
    value: string | number,
  ) => {
    const updated = sections.map((s, si) => {
      if (si !== sIdx) return s;
      const items = s.items.map((item, ii) => {
        if (ii !== iIdx) return item;
        return { ...item, [field]: field === "name" ? value : Number(value) };
      });
      return { ...s, items };
    });
    onChange(updated);
  };

  const addItem = (sIdx: number) => {
    const updated = sections.map((s, i) => {
      if (i !== sIdx) return s;
      return { ...s, items: [...s.items, { name: "", qty: 1, rate: 0 }] };
    });
    onChange(updated);
  };

  const removeItem = (sIdx: number, iIdx: number) => {
    const updated = sections.map((s, i) => {
      if (i !== sIdx) return s;
      return { ...s, items: s.items.filter((_, ii) => ii !== iIdx) };
    });
    onChange(updated);
  };

  const grandTotal = sections.reduce(
    (t, s) => t + s.items.reduce((st, item) => st + item.qty * item.rate, 0),
    0,
  );

  return (
    <div className="space-y-4">
      {sections.map((section, sIdx) => {
        const sectionTotal = section.items.reduce((t, item) => t + item.qty * item.rate, 0);
        return (
          <div key={sIdx} className="border rounded-md p-3 space-y-3 bg-muted/20">
            {/* Section header */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Section title (e.g. SEO Services)"
                value={section.title}
                onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                className="flex-1 h-8 text-sm"
              />
              {sections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSection(sIdx)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-1.5 text-xs text-muted-foreground px-0.5">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {/* Items */}
            {section.items.map((item, iIdx) => {
              const lineTotal = item.qty * item.rate;
              return (
                <div key={iIdx} className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-1.5 items-center">
                  <Input
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => updateItem(sIdx, iIdx, "name", e.target.value)}
                    className="h-7 text-xs"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => updateItem(sIdx, iIdx, "qty", e.target.value)}
                    className="h-7 text-xs text-center"
                  />
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.rate}
                    onChange={(e) => updateItem(sIdx, iIdx, "rate", e.target.value)}
                    className="h-7 text-xs text-right"
                  />
                  <div className="text-xs text-right font-mono text-muted-foreground pr-0.5">
                    {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {section.items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(sIdx, iIdx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}

            {/* Section subtotal + add item */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => addItem(sIdx)}
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Add Item
              </Button>
              <span className="text-xs text-muted-foreground font-mono">
                Subtotal: {sectionTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        );
      })}

      {/* Add section */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={addSection}
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Section
      </Button>

      {/* Grand total */}
      <div className="flex justify-end border-t pt-2">
        <span className="text-sm font-semibold">
          Grand Total: {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default blank sections
// ---------------------------------------------------------------------------

const defaultSections = (): ProposalSection[] => [
  { title: "", items: [{ name: "", qty: 1, rate: 0 }] },
];

// ---------------------------------------------------------------------------
// Proposal Form (shared by create + edit)
// ---------------------------------------------------------------------------

interface ProposalFormProps {
  initial?: Proposal | null;
  clients: { id: string; companyName: string }[];
  onSubmit: (data: {
    clientId: string;
    title: string;
    sections: ProposalSection[];
    currency: string;
    validUntil: string | null;
    notes: string | null;
  }) => void;
  isLoading: boolean;
}

function ProposalForm({ initial, clients, onSubmit, isLoading }: ProposalFormProps) {
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [sections, setSections] = useState<ProposalSection[]>(
    initial?.sections?.length ? initial.sections : defaultSections(),
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      clientId,
      title,
      sections,
      currency,
      validUntil: validUntil || null,
      notes: notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client */}
      <div className="space-y-1.5">
        <Label>Client *</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Select client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input
          required
          placeholder="e.g. Q1 2026 Marketing Services"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Sections editor */}
      <div className="space-y-1.5">
        <Label>Line Items</Label>
        <SectionsEditor sections={sections} onChange={setSections} />
      </div>

      {/* Currency & Valid Until */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="SGD">SGD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valid Until</Label>
          <Input
            type="date"
            value={validUntil ?? ""}
            onChange={(e) => setValidUntil(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          placeholder="Additional notes or terms..."
          value={notes ?? ""}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading || !clientId || !title}>
          {isLoading ? "Saving..." : initial ? "Update Proposal" : "Create Proposal"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main Proposals Page
// ---------------------------------------------------------------------------

const STATUS_TRANSITIONS: { label: string; value: ProposalStatus }[] = [
  { label: "Mark as Sent", value: "sent" },
  { label: "Mark as Viewed", value: "viewed" },
  { label: "Accept", value: "accepted" },
  { label: "Decline", value: "declined" },
];

export default function Proposals() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editProposal, setEditProposal] = useState<Proposal | null>(null);
  const [deleteProposal, setDeleteProposal] = useState<Proposal | null>(null);

  const { data: proposals = [], isLoading } = useProposals();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal();
  const deleteMutation = useDeleteProposal();
  const statusMutation = useUpdateProposalStatus();

  // Summary stats
  const total = proposals.length;
  const draftCount = proposals.filter((p) => p.status === "draft").length;
  const sentViewedCount = proposals.filter(
    (p) => p.status === "sent" || p.status === "viewed",
  ).length;
  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const acceptedValue = proposals
    .filter((p) => p.status === "accepted")
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const handleCreate = (data: {
    clientId: string;
    title: string;
    sections: ProposalSection[];
    currency: string;
    validUntil: string | null;
    notes: string | null;
  }) => {
    createMutation.mutate(data, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleUpdate = (data: {
    clientId: string;
    title: string;
    sections: ProposalSection[];
    currency: string;
    validUntil: string | null;
    notes: string | null;
  }) => {
    if (!editProposal) return;
    updateMutation.mutate(
      {
        id: editProposal.id,
        title: data.title,
        sections: data.sections,
        currency: data.currency,
        validUntil: data.validUntil,
        notes: data.notes,
      },
      { onSuccess: () => setEditProposal(null) },
    );
  };

  const handleDelete = () => {
    if (!deleteProposal) return;
    deleteMutation.mutate(deleteProposal.id, {
      onSuccess: () => setDeleteProposal(null),
    });
  };

  const handleStatusChange = (id: string, status: ProposalStatus) => {
    statusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Proposals</h1>
          <p className="text-muted-foreground">Create and manage client proposals</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Proposal</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new proposal for a client.
              </DialogDescription>
            </DialogHeader>
            <ProposalForm
              clients={clients}
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{draftCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sent / Viewed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{sentViewedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">{acceptedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Accepted Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-display font-bold">
                {acceptedValue.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="No proposals yet"
                      description="Create your first proposal to start sending quotes to clients."
                    />
                  </TableCell>
                </TableRow>
              )}
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-mono text-xs">
                    {proposal.proposalCode ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {proposal.clientName ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={proposal.title}>
                    {proposal.title}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatAmount(proposal.totalAmount, proposal.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={proposal.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {proposal.validUntil ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {proposal.createdAt
                      ? new Date(proposal.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {/* Status dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Change status"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {STATUS_TRANSITIONS.filter(
                            (t) => t.value !== proposal.status,
                          ).map((t) => (
                            <DropdownMenuItem
                              key={t.value}
                              onClick={() =>
                                handleStatusChange(proposal.id, t.value)
                              }
                            >
                              {t.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditProposal(proposal)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteProposal(proposal)}
                      >
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

      {/* Edit Dialog */}
      <Dialog open={!!editProposal} onOpenChange={(open) => !open && setEditProposal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Proposal</DialogTitle>
            <DialogDescription>
              Update the proposal details below.
            </DialogDescription>
          </DialogHeader>
          {editProposal && (
            <ProposalForm
              initial={editProposal}
              clients={clients}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteProposal}
        onOpenChange={(open) => !open && setDeleteProposal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete proposal{" "}
              <strong>{deleteProposal?.proposalCode ?? deleteProposal?.title}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
