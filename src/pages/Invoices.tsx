import { useState } from "react";
import { mockInvoices } from "@/data/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceStatus } from "@/types";

const statusColor: Record<InvoiceStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Sent: "bg-primary/10 text-primary",
  Paid: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
};

export default function Invoices() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");

  const filtered = mockInvoices.filter((inv) => {
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    const matchesMarket = marketFilter === "all" || inv.market === marketFilter;
    return matchesStatus && matchesMarket;
  });

  const totalByCurrency = mockInvoices.reduce((acc, inv) => {
    if (inv.status === "Paid" || inv.status === "Sent") {
      acc[inv.currency] = (acc[inv.currency] || 0) + inv.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Invoice & Revenue</h1>
        <p className="text-muted-foreground">Track invoices and revenue across markets</p>
      </div>

      {/* Revenue Summary */}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
