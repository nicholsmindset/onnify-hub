import { useState } from "react";
import { useContent } from "@/hooks/use-content";
import { useCreateReview } from "@/hooks/use-content-reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, MessageSquare, X } from "lucide-react";
import { ContentItem } from "@/types";

interface PortalContentReviewProps {
  clientId: string;
  portalContactName: string;
}

type ReviewDialogType = "request_changes" | "reject";

export function PortalContentReview({ clientId, portalContactName }: PortalContentReviewProps) {
  const [reviewDialog, setReviewDialog] = useState<{
    type: ReviewDialogType;
    item: ContentItem;
  } | null>(null);
  const [comment, setComment] = useState("");

  const { data: items = [], isLoading } = useContent({ clientId, status: "Review" });
  const createReview = useCreateReview();

  const handleApprove = (item: ContentItem) => {
    createReview.mutate({
      contentId: item.id,
      reviewerType: "client",
      reviewerName: portalContactName,
      action: "approve",
    });
  };

  const handleOpenDialog = (type: ReviewDialogType, item: ContentItem) => {
    setComment("");
    setReviewDialog({ type, item });
  };

  const handleSubmitReview = () => {
    if (!reviewDialog) return;
    createReview.mutate(
      {
        contentId: reviewDialog.item.id,
        reviewerType: "client",
        reviewerName: portalContactName,
        action: reviewDialog.type,
        comments: comment || undefined,
      },
      {
        onSuccess: () => {
          setReviewDialog(null);
          setComment("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content Review</CardTitle>
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"} awaiting your review
        </p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No content items awaiting review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.contentType}
                      </Badge>
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground">Due {item.dueDate}</span>
                      )}
                    </div>
                  </div>
                </div>

                {item.contentBody && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.contentBody.length > 200
                      ? `${item.contentBody.substring(0, 200)}...`
                      : item.contentBody}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(item)}
                    disabled={createReview.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={() => handleOpenDialog("request_changes", item)}
                    disabled={createReview.isPending}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                    onClick={() => handleOpenDialog("reject", item)}
                    disabled={createReview.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Comment Dialog for Request Changes / Reject */}
      <Dialog
        open={!!reviewDialog}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDialog(null);
            setComment("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog?.type === "request_changes" ? "Request Changes" : "Reject Content"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reviewDialog?.type === "request_changes"
                ? `Provide feedback for "${reviewDialog?.item.title}" so the team can make changes.`
                : `Explain why "${reviewDialog?.item.title}" is being rejected.`}
            </p>
            <Textarea
              placeholder="Enter your comments..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog(null);
                setComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={createReview.isPending}
              className={
                reviewDialog?.type === "request_changes"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {createReview.isPending
                ? "Submitting..."
                : reviewDialog?.type === "request_changes"
                  ? "Submit Feedback"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
