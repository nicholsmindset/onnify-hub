import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentItem, mapContentItem, toContentItemRow } from "@/types";
import { toast } from "sonner";

interface ContentFilters {
  assignee?: string;
  market?: string;
  clientId?: string;
  status?: string;
  contentType?: string;
}

export function useContent(filters?: ContentFilters) {
  return useQuery({
    queryKey: ["content", filters],
    queryFn: async (): Promise<ContentItem[]> => {
      let query = supabase
        .from("content_with_client")
        .select("*")
        .order("due_date", { ascending: true });

      if (filters?.assignee && filters.assignee !== "all") {
        query = query.eq("assigned_to", filters.assignee);
      }
      if (filters?.market && filters.market !== "all") {
        query = query.eq("market", filters.market);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.contentType && filters.contentType !== "all") {
        query = query.eq("content_type", filters.contentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapContentItem(row as Record<string, unknown>));
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ContentItem> & { contentId?: string }) => {
      const row = toContentItemRow(values);
      if (values.contentId) {
        (row as Record<string, unknown>).content_id = values.contentId;
      }
      const { data, error } = await supabase
        .from("content_items")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapContentItem(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content item created");
    },
    onError: (error) => {
      toast.error(`Failed to create content: ${error.message}`);
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ContentItem> & { id: string }) => {
      const row = toContentItemRow(values);
      const { data, error } = await supabase
        .from("content_items")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapContentItem(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content item updated");
    },
    onError: (error) => {
      toast.error(`Failed to update content: ${error.message}`);
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
      toast.success("Content item deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete content: ${error.message}`);
    },
  });
}
