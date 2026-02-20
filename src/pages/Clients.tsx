import { useState } from "react";
import { mockClients } from "@/data/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Client, ClientStatus, Market } from "@/types";

const statusColor: Record<ClientStatus, string> = {
  Prospect: "bg-muted text-muted-foreground",
  Onboarding: "bg-warning/10 text-warning",
  Active: "bg-success/10 text-success",
  Churned: "bg-destructive/10 text-destructive",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = mockClients.filter((c) => {
    const matchesSearch = c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.clientId.toLowerCase().includes(search.toLowerCase());
    const matchesMarket = marketFilter === "all" || c.market === marketFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesMarket && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Registry</h1>
          <p className="text-muted-foreground">{mockClients.length} clients across all markets</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Client</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((client) => (
              <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
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
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No clients found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
