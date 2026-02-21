import { useState } from "react";
import { useContentRequests, useUpdateContentRequest } from "@/hooks/use-content-requests";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Check, X, ArrowRightCircle } from "lucide-react";
import { ContentRequest, RequestPriority, RequestStatus } from "@/types";

const priorityColor: Record<RequestPriority, string> = {
  standard: "bg-muted text-muted-foreground",
  urgent: "bg-warning/10 text-warning",
  rush: "bg-destructive/10 text-destructive",
};

const statusColor: Record<RequestStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  converted: "bg-primary/10 text-primary",
};

export default function ContentRequests() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [rejectRequest, setRejectRequest] = useState<ContentRequest | null>(null);

  const { data: requests = [], isLoading } = useContentRequests({ status: statusFilter });
  const updateMutation = useUpdateContentRequest();

  const handleAccept = (request: ContentRequest) => {
    updateMutation.mutate({ id: request.id, status: "accepted" as RequestStatus });
  };

  const handleReject = () => {
    if (!rejectRequest) return;
    updateMutation.mutate(
      { id: rejectRequest.id, status: "rejected" as RequestStatus },
      { onSuccess: () => setRejectRequest(null) }
    );
  };

  const handleConvert = (request: ContentRequest) => {
    updateMutation.mutate({ id: request.id, status: "converted" as RequestStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Content Requests</h1>
          <p className="text-muted-foreground">{requests.length} incoming content requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
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
                <TableHead>Request ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Desired Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-xs">{request.requestId}</TableCell>
                  <TableCell className="font-medium">{request.clientName || "Unknown"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.topic}</TableCell>
                  <TableCell><Badge variant="outline">{request.contentType}</Badge></TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[request.priority]}`}>
                      {request.priority}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{request.desiredDate || "-"}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[request.status]}`}>
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-success"
                            onClick={() => handleAccept(request)}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setRejectRequest(request)}
                            disabled={updateMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {request.status === "accepted" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => handleConvert(request)}
                          disabled={updateMutation.isPending}
                        >
                          <ArrowRightCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No content requests found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject Confirmation */}
      <AlertDialog open={!!rejectRequest} onOpenChange={(open) => !open && setRejectRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Content Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this content request from {rejectRequest?.clientName}? The topic is &quot;{rejectRequest?.topic}&quot;. This action will mark the request as rejected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
