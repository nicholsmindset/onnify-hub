import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentVersion, mapContentVersion } from "@/types";
import { toast } from "sonner";

export function useContentVersions(contentId: string | undefined) {
  return useQuery({
    queryKey: ["content-versions", contentId],
    queryFn: async (): Promise<ContentVersion[]> => {
      const { data, error } = await supabase
        .from("content_versions")
        .select("*")
        .eq("content_id", contentId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapContentVersion(row as Record<string, unknown>));
    },
    enabled: !!contentId,
  });
}

export function useCreateVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      contentId: string;
      versionNumber: number;
      title: string;
      contentBody?: string;
      author: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("content_versions")
        .insert({
          content_id: values.contentId,
          version_number: values.versionNumber,
          title: values.title,
          content_body: values.contentBody || null,
          author: values.author,
          notes: values.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return mapContentVersion(data as Record<string, unknown>);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content-versions", variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success(`Version ${variables.versionNumber} saved`);
    },
    onError: (error) => {
      toast.error(`Failed to save version: ${error.message}`);
    },
  });
}
