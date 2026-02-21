import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { SlaDefinition, mapSlaDefinition, toSlaDefinitionRow } from "@/types";
import { toast } from "sonner";

export function useSlaDefinitions() {
  return useQuery({
    queryKey: ["sla-definitions"],
    queryFn: async (): Promise<SlaDefinition[]> => {
      const { data, error } = await supabase
        .from("sla_definitions")
        .select("*")
        .order("content_type", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapSlaDefinition(row as Record<string, unknown>));
    },
  });
}

export function useUpdateSlaDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<SlaDefinition> & { id: string }) => {
      const row = toSlaDefinitionRow(values);
      const { data, error } = await supabase
        .from("sla_definitions")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapSlaDefinition(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-definitions"] });
      toast.success("SLA definition updated");
    },
    onError: (error) => {
      toast.error(`Failed to update SLA: ${error.message}`);
    },
  });
}
