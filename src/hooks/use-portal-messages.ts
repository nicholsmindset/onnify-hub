import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PortalMessage, mapPortalMessage, toPortalMessageRow } from "@/types";
import { toast } from "sonner";

export function usePortalMessages(clientId?: string) {
  return useQuery({
    queryKey: ["portal_messages", clientId],
    queryFn: async (): Promise<PortalMessage[]> => {
      const { data, error } = await supabase
        .from("portal_messages")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapPortalMessage(row as Record<string, unknown>));
    },
    enabled: !!clientId,
    refetchInterval: 30000, // Poll every 30s for new messages
  });
}

export function useDeliverableFeedback(deliverableId?: string) {
  return useQuery({
    queryKey: ["portal_messages", "deliverable", deliverableId],
    queryFn: async (): Promise<PortalMessage[]> => {
      const { data, error } = await supabase
        .from("portal_messages")
        .select("*")
        .eq("deliverable_id", deliverableId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapPortalMessage(row as Record<string, unknown>));
    },
    enabled: !!deliverableId,
  });
}

export function useSendPortalMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<PortalMessage>) => {
      const row = toPortalMessageRow(values);
      const { data, error } = await supabase
        .from("portal_messages")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapPortalMessage(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portal_messages", data.clientId] });
      if (data.deliverableId) {
        queryClient.invalidateQueries({ queryKey: ["portal_messages", "deliverable", data.deliverableId] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}
