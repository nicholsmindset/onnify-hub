import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientOnboarding, mapClientOnboarding, toClientOnboardingRow } from "@/types";
import { toast } from "sonner";

export function useOnboarding(clientId: string | undefined) {
  return useQuery({
    queryKey: ["onboarding", clientId],
    queryFn: async (): Promise<ClientOnboarding | null> => {
      const { data, error } = await supabase
        .from("client_onboarding")
        .select("*")
        .eq("client_id", clientId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapClientOnboarding(data as Record<string, unknown>) : null;
    },
    enabled: !!clientId,
  });
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ClientOnboarding>) => {
      const row = toClientOnboardingRow(values);
      const { data, error } = await supabase
        .from("client_onboarding")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapClientOnboarding(data as Record<string, unknown>);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Onboarding started");
    },
    onError: (error) => {
      toast.error(`Failed to start onboarding: ${error.message}`);
    },
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ClientOnboarding> & { id: string }) => {
      const row = toClientOnboardingRow(values);
      const { data, error } = await supabase
        .from("client_onboarding")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapClientOnboarding(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Onboarding updated");
    },
    onError: (error) => {
      toast.error(`Failed to update onboarding: ${error.message}`);
    },
  });
}
