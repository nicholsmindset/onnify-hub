import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Deliverable, mapDeliverable, toDeliverableRow } from "@/types";
import { isDemoMode, DEMO_DELIVERABLES } from "@/lib/demo-data";
import { toast } from "sonner";

interface DeliverableFilters {
  assignee?: string;
  market?: string;
  clientId?: string;
}

export function useDeliverables(filters?: DeliverableFilters) {
  return useQuery({
    queryKey: ["deliverables", filters],
    queryFn: async (): Promise<Deliverable[]> => {
      if (isDemoMode()) {
        let results = [...DEMO_DELIVERABLES];
        if (filters?.assignee && filters.assignee !== "all") results = results.filter(d => d.assignedTo === filters.assignee);
        if (filters?.market && filters.market !== "all") results = results.filter(d => d.market === filters.market);
        if (filters?.clientId) results = results.filter(d => d.clientId === filters.clientId);
        return results;
      }

      let query = supabase
        .from("deliverables_with_client")
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

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapDeliverable(row as Record<string, unknown>));
    },
  });
}

export function useDeliverable(id: string | undefined) {
  return useQuery({
    queryKey: ["deliverables", id],
    queryFn: async (): Promise<Deliverable> => {
      if (isDemoMode()) {
        const found = DEMO_DELIVERABLES.find(d => d.id === id);
        if (!found) throw new Error("Deliverable not found");
        return found;
      }
      const { data, error } = await supabase
        .from("deliverables_with_client")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Deliverable> & { deliverableId?: string }) => {
      const row = toDeliverableRow(values);
      if (values.deliverableId) {
        (row as Record<string, unknown>).deliverable_id = values.deliverableId;
      }
      const { data, error } = await supabase
        .from("deliverables")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Deliverable> & { id: string }) => {
      const row = toDeliverableRow(values);
      const { data, error } = await supabase
        .from("deliverables")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable updated");
    },
    onError: (error) => {
      toast.error(`Failed to update deliverable: ${error.message}`);
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliverables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete deliverable: ${error.message}`);
    },
  });
}
