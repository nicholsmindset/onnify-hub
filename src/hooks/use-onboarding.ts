import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientOnboarding, mapClientOnboarding } from "@/types";

export function useClientOnboarding(portalAccessId?: string) {
  return useQuery({
    queryKey: ["client_onboarding", portalAccessId],
    queryFn: async (): Promise<ClientOnboarding | null> => {
      const { data, error } = await supabase
        .from("client_onboarding")
        .select("*")
        .eq("portal_access_id", portalAccessId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapClientOnboarding(data as Record<string, unknown>) : null;
    },
    enabled: !!portalAccessId,
  });
}

export function useUpsertOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ClientOnboarding> & { portalAccessId: string }) => {
      const row: Record<string, unknown> = {
        portal_access_id: values.portalAccessId,
        current_step: values.currentStep,
        completed_at: values.completedAt ?? null,
        industry: values.industry ?? null,
        website_url: values.websiteUrl ?? null,
        business_description: values.businessDescription ?? null,
        target_audience: values.targetAudience ?? null,
        primary_color: values.primaryColor ?? null,
        secondary_color: values.secondaryColor ?? null,
        font_preferences: values.fontPreferences ?? null,
        brand_voice: values.brandVoice ?? null,
        brand_dos: values.brandDos ?? null,
        brand_donts: values.brandDonts ?? null,
        competitors: values.competitors ?? [],
        goals: values.goals ?? null,
        priority_1: values.priority1 ?? null,
        priority_2: values.priority2 ?? null,
        priority_3: values.priority3 ?? null,
        communication_style: values.communicationStyle ?? null,
        additional_notes: values.additionalNotes ?? null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("client_onboarding")
        .upsert(row, { onConflict: "portal_access_id" })
        .select()
        .single();
      if (error) throw error;
      return mapClientOnboarding(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client_onboarding", data.portalAccessId] });
    },
  });
}
