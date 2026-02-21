import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  RetainerTier, mapRetainerTier, toRetainerTierRow,
  RetainerUsage, mapRetainerUsage, toRetainerUsageRow,
} from "@/types";
import { toast } from "sonner";

export function useRetainerTiers() {
  return useQuery({
    queryKey: ["retainer-tiers"],
    queryFn: async (): Promise<RetainerTier[]> => {
      const { data, error } = await supabase
        .from("retainer_tiers")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapRetainerTier(row as Record<string, unknown>));
    },
  });
}

export function useUpdateRetainerTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<RetainerTier> & { id: string }) => {
      const row = toRetainerTierRow(values);
      const { data, error } = await supabase
        .from("retainer_tiers")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapRetainerTier(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retainer-tiers"] });
      toast.success("Retainer tier updated");
    },
    onError: (error) => {
      toast.error(`Failed to update tier: ${error.message}`);
    },
  });
}

export function useRetainerUsage(clientId: string | undefined, month?: string) {
  return useQuery({
    queryKey: ["retainer-usage", clientId, month],
    queryFn: async (): Promise<RetainerUsage | null> => {
      let query = supabase
        .from("retainer_usage")
        .select("*")
        .eq("client_id", clientId!);

      if (month) {
        query = query.eq("month", month);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? mapRetainerUsage(data as Record<string, unknown>) : null;
    },
    enabled: !!clientId,
  });
}

export function useUpdateRetainerUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<RetainerUsage> & { id?: string; clientId: string; month: string }) => {
      const row = toRetainerUsageRow(values);

      if (id) {
        const { data, error } = await supabase
          .from("retainer_usage")
          .update(row)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return mapRetainerUsage(data as Record<string, unknown>);
      } else {
        const { data, error } = await supabase
          .from("retainer_usage")
          .upsert({ ...row, client_id: values.clientId, month: values.month })
          .select()
          .single();
        if (error) throw error;
        return mapRetainerUsage(data as Record<string, unknown>);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retainer-usage", data.clientId] });
      toast.success("Retainer usage updated");
    },
    onError: (error) => {
      toast.error(`Failed to update usage: ${error.message}`);
    },
  });
}
