import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Client, mapClient, toClientRow } from "@/types";
import { isDemoMode, DEMO_CLIENTS } from "@/lib/demo-data";
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
      if (isDemoMode()) {
        let results = [...DEMO_CLIENTS];
        if (filters?.market && filters.market !== "all") results = results.filter(c => c.market === filters.market);
        if (filters?.status && filters.status !== "all") results = results.filter(c => c.status === filters.status);
        if (filters?.search) { const s = filters.search.toLowerCase(); results = results.filter(c => c.companyName.toLowerCase().includes(s) || c.clientId.toLowerCase().includes(s)); }
        return results;
      }

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
          `company_name.ilike.%${filters.search}%,client_id.ilike.%${filters.search}%`
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
      if (isDemoMode()) {
        const found = DEMO_CLIENTS.find(c => c.id === id);
        if (!found) throw new Error("Client not found");
        return found;
      }
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
    mutationFn: async (values: Partial<Client> & { clientId?: string }) => {
      const row = toClientRow(values);
      if (values.clientId) {
        (row as Record<string, unknown>).client_id = values.clientId;
      }
      const { data, error } = await supabase
        .from("clients")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapClient(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created successfully");
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
