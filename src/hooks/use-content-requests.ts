import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContentRequest, mapContentRequest, toContentRequestRow } from "@/types";
import { toast } from "sonner";

interface RequestFilters {
  clientId?: string;
  status?: string;
}

export function useContentRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ["content-requests", filters],
    queryFn: async (): Promise<ContentRequest[]> => {
      let query = supabase
        .from("content_requests_with_client")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapContentRequest(row as Record<string, unknown>));
    },
  });
}

export function useCreateContentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ContentRequest> & { requestId?: string }) => {
      const row = toContentRequestRow(values);
      if (values.requestId) {
        (row as Record<string, unknown>).request_id = values.requestId;
      }
      const { data, error } = await supabase
        .from("content_requests")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapContentRequest(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      toast.success("Content request submitted");
    },
    onError: (error) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  });
}

export function useUpdateContentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ContentRequest> & { id: string }) => {
      const row = toContentRequestRow(values);
      const { data, error } = await supabase
        .from("content_requests")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapContentRequest(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-requests"] });
      toast.success("Request updated");
    },
    onError: (error) => {
      toast.error(`Failed to update request: ${error.message}`);
    },
  });
}
