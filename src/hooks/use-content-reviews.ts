import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentReview, mapContentReview } from "@/types";
import { toast } from "sonner";

export function useContentReviews(contentId: string | undefined) {
  return useQuery({
    queryKey: ["content-reviews", contentId],
    queryFn: async (): Promise<ContentReview[]> => {
      const { data, error } = await supabase
        .from("content_reviews")
        .select("*")
        .eq("content_id", contentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapContentReview(row as Record<string, unknown>));
    },
    enabled: !!contentId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      contentId: string;
      reviewerType: string;
      reviewerName: string;
      action: string;
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from("content_reviews")
        .insert({
          content_id: values.contentId,
          reviewer_type: values.reviewerType,
          reviewer_name: values.reviewerName,
          action: values.action,
          comments: values.comments || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapContentReview(data as Record<string, unknown>);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-reviews", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Review submitted");
    },
    onError: (error) => {
      toast.error(`Failed to submit review: ${error.message}`);
    },
  });
}
