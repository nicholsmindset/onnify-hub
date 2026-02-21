import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClientReports, useCreateClientReport, useUpdateClientReport } from "@/hooks/use-client-reports";
import { useClients } from "@/hooks/use-clients";
import { clientReportSchema, ClientReportFormValues } from "@/lib/validations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Send } from "lucide-react";
import { ClientReport, ReportStatus } from "@/types";

const statusColor: Record<ReportStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success",
};

export default function ClientReports() {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewReport, setViewReport] = useState<ClientReport | null>(null);

  const { data: reports = [], isLoading } = useClientReports();
  const { data: clients = [] } = useClients();
  const createMutation = useCreateClientReport();
  const updateMutation = useUpdateClientReport();

  const form = useForm<ClientReportFormValues>({
    resolver: zodResolver(clientReportSchema),
    defaultValues: {
      clientId: "",
      month: "",
      summary: "",
      recommendations: "",
    },
  });

  const handleCreate = (data: ClientReportFormValues) => {
    createMutation.mutate(
      {
        clientId: data.clientId,
        month: data.month,
        summary: data.summary || undefined,
        recommendations: data.recommendations || undefined,
        status: "draft" as ReportStatus,
        contentDelivered: [],
        pipelineStatus: {},
        performanceData: {},
      },
      {
        onSuccess: () => {
          setCreateOpen(false);
          form.reset();
        },
      }
    );
  };

  const handlePublish = (report: ClientReport) => {
    updateMutation.mutate({ id: report.id, status: "published" as ReportStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Client Reports</h1>
          <p className="text-muted-foreground">{reports.length} reports generated</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) form.reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Generate Report</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <FormControl>
                        <Input type="month" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Monthly summary of content activities..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recommendations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommendations</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Strategic recommendations for the next period..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Generating..." : "Generate Report"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                <TableHead>Report ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs">{report.reportId}</TableCell>
                  <TableCell className="font-medium">{report.clientName || "Unknown"}</TableCell>
                  <TableCell className="text-sm">{report.month}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[report.status]}`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewReport(report)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {report.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => handlePublish(report)}
                          disabled={updateMutation.isPending}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No reports found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Report Sheet */}
      <Sheet open={!!viewReport} onOpenChange={(open) => !open && setViewReport(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Report Details</SheetTitle>
          </SheetHeader>
          {viewReport && (
            <div className="mt-6 space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Report ID</p>
                <p className="font-mono text-sm">{viewReport.reportId}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium">{viewReport.clientName || "Unknown"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Month</p>
                <p className="text-sm">{viewReport.month}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[viewReport.status]}`}>
                  {viewReport.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Summary</p>
                <p className="text-sm whitespace-pre-wrap">{viewReport.summary || "No summary provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Content Delivered</p>
                {viewReport.contentDelivered.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {viewReport.contentDelivered.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{String(item.type || item.content_type || "Content")}</Badge>
                        <span>{String(item.title || item.name || `Item ${idx + 1}`)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No content data</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Performance Data</p>
                {Object.keys(viewReport.performanceData).length > 0 ? (
                  <div className="text-sm space-y-1">
                    {Object.entries(viewReport.performanceData).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No performance data</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Recommendations</p>
                <p className="text-sm whitespace-pre-wrap">{viewReport.recommendations || "No recommendations provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm">{viewReport.createdAt ? new Date(viewReport.createdAt).toLocaleDateString() : "-"}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
