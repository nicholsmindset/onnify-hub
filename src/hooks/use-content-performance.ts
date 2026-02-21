import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentPerformance, mapContentPerformance, toContentPerformanceRow } from "@/types";
import { toast } from "sonner";

export function useContentPerformance(contentId: string | undefined) {
  return useQuery({
    queryKey: ["content-performance", contentId],
    queryFn: async (): Promise<ContentPerformance | null> => {
      const { data, error } = await supabase
        .from("content_performance")
        .select("*")
        .eq("content_id", contentId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapContentPerformance(data as Record<string, unknown>) : null;
    },
    enabled: !!contentId,
  });
}

export function useUpdateContentPerformance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      contentId: string;
      impressions: number;
      clicks: number;
      avgPosition?: number;
      performanceTier?: string;
    }) => {
      const row = {
        ...toContentPerformanceRow(values as Partial<ContentPerformance>),
        last_updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("content_performance")
        .upsert(
          { content_id: values.contentId, ...row },
          { onConflict: "content_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return mapContentPerformance(data as Record<string, unknown>);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-performance", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Performance data updated");
    },
    onError: (error) => {
      toast.error(`Failed to update performance: ${error.message}`);
    },
  });
}
