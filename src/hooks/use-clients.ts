import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client, mapClient, toClientRow } from "@/types";
import { toast } from "sonner";

interface ClientFilters {
  market?: string;
  status?: string;
  search?: string;
}

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ["clients", filters],
    queryFn: async (): Promise<Client[]> => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.market && filters.market !== "all") {
        query = query.eq("market", filters.market);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,client_code.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapClient(row as Record<string, unknown>));
    },
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async (): Promise<Client> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapClient(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Client>) => {
      const row = toClientRow(values);
      const { data: idData, error: idError } = await supabase.rpc("generate_client_id", {
        p_market: values.market,
      });
      if (idError) throw idError;
      (row as Record<string, unknown>).client_code = idData;
      const { data, error } = await supabase
        .from("clients")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapClient(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
      supabase.from("activity_logs").insert({
        event_type: "client_created",
        title: `New client added: ${data.companyName}`,
        client_id: data.id,
        client_name: data.companyName,
        actor: "agency",
        link_path: `/clients/${data.id}`,
      }).then(() => {}).catch(() => {});
    },
    onError: (error) => {
      toast.error(`Failed to create client: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Client> & { id: string }) => {
      const row = toClientRow(values);
      const { data, error } = await supabase
        .from("clients")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapClient(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete client: ${error.message}`);
    },
  });
}
