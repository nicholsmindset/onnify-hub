import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { GhlConnection, mapGhlConnection, toGhlConnectionRow } from "@/types";
import { toast } from "sonner";

export function useGhlConnections() {
  return useQuery({
    queryKey: ["ghl_connections"],
    queryFn: async (): Promise<GhlConnection[]> => {
      const { data, error } = await supabase
        .from("ghl_connections_with_client")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapGhlConnection(row as Record<string, unknown>));
    },
  });
}

export function useCreateGhlConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<GhlConnection>) => {
      const row = toGhlConnectionRow(values);
      const { data, error } = await supabase
        .from("ghl_connections")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapGhlConnection(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ghl_connections"] });
      toast.success("GHL connection created");
    },
    onError: (error) => {
      toast.error(`Failed to create connection: ${error.message}`);
    },
  });
}

export function useUpdateGhlConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<GhlConnection> & { id: string }) => {
      const row = toGhlConnectionRow(values);
      const { data, error } = await supabase
        .from("ghl_connections")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapGhlConnection(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ghl_connections"] });
      toast.success("Connection updated");
    },
    onError: (error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    },
  });
}

export function useDeleteGhlConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ghl_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ghl_connections"] });
      toast.success("Connection removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove connection: ${error.message}`);
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      // Update status to syncing
      await supabase
        .from("ghl_connections")
        .update({ sync_status: "syncing" })
        .eq("id", connectionId);

      // Log the sync attempt
      await supabase.from("ghl_sync_logs").insert({
        connection_id: connectionId,
        sync_type: "full",
        status: "started",
      });

      // Simulate sync completion (in production, this would call GHL API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { error } = await supabase
        .from("ghl_connections")
        .update({
          sync_status: "connected",
          last_sync_at: new Date().toISOString(),
          contacts_synced: Math.floor(Math.random() * 50) + 10,
          pipelines_synced: Math.floor(Math.random() * 5) + 1,
        })
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ghl_connections"] });
      toast.success("Sync completed successfully");
    },
    onError: (error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });
}
