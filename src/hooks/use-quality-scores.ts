import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QualityScore, mapQualityScore, toQualityScoreRow } from "@/types";
import { toast } from "sonner";

export function useQualityScore(contentId: string | undefined) {
  return useQuery({
    queryKey: ["quality-score", contentId],
    queryFn: async (): Promise<QualityScore | null> => {
      const { data, error } = await supabase
        .from("quality_scores")
        .select("*")
        .eq("content_id", contentId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapQualityScore(data as Record<string, unknown>) : null;
    },
    enabled: !!contentId,
  });
}

function calculateComposite(scores: {
  seoScore: number;
  brandVoiceScore: number;
  uniquenessScore: number;
  humannessScore: number;
  completenessScore: number;
}): number {
  return Math.round(
    scores.seoScore * 0.3 +
    scores.brandVoiceScore * 0.25 +
    scores.uniquenessScore * 0.2 +
    scores.humannessScore * 0.15 +
    scores.completenessScore * 0.1
  );
}

export function useUpdateQualityScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      contentId: string;
      seoScore: number;
      brandVoiceScore: number;
      uniquenessScore: number;
      humannessScore: number;
      completenessScore: number;
      scoredBy?: string;
    }) => {
      const compositeScore = calculateComposite(values);
      const row = {
        ...toQualityScoreRow({ ...values, compositeScore }),
        scored_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("quality_scores")
        .upsert(
          { content_id: values.contentId, ...row },
          { onConflict: "content_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return mapQualityScore(data as Record<string, unknown>);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["quality-score", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Quality score updated");
    },
    onError: (error) => {
      toast.error(`Failed to update score: ${error.message}`);
    },
  });
}
