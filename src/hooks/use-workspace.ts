import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface WorkspaceSettings {
  id: string;
  agencyName: string;
  logoUrl: string | null;
  accentColor: string;
  defaultMarket: string;
  portalTitle: string;
  portalWelcomeMessage: string | null;
  portalAccentColor: string | null;
  hidePoweredBy: boolean;
}

function toWorkspace(row: Record<string, unknown>): WorkspaceSettings {
  return {
    id: row.id as string,
    agencyName: (row.agency_name as string) || "Onnify Works",
    logoUrl: (row.logo_url as string | null) ?? null,
    accentColor: (row.accent_color as string) || "#6366f1",
    defaultMarket: (row.default_market as string) || "SG",
    portalTitle: (row.portal_title as string) || "Your Project Portal",
    portalWelcomeMessage: (row.portal_welcome_message as string | null) ?? null,
    portalAccentColor: (row.portal_accent_color as string | null) ?? null,
    hidePoweredBy: (row.hide_powered_by as boolean) ?? false,
  };
}

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: ["workspace_settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workspace_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return toWorkspace(data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Omit<WorkspaceSettings, "id">>) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.agencyName !== undefined) dbUpdates.agency_name = updates.agencyName;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor;
      if (updates.defaultMarket !== undefined) dbUpdates.default_market = updates.defaultMarket;
      if (updates.portalTitle !== undefined) dbUpdates.portal_title = updates.portalTitle;
      if (updates.portalWelcomeMessage !== undefined) dbUpdates.portal_welcome_message = updates.portalWelcomeMessage;
      if (updates.portalAccentColor !== undefined) dbUpdates.portal_accent_color = updates.portalAccentColor;
      if (updates.hidePoweredBy !== undefined) dbUpdates.hide_powered_by = updates.hidePoweredBy;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from("workspace_settings")
        .update(dbUpdates)
        .select()
        .single();
      if (error) throw error;
      return toWorkspace(data);
    },
    onSuccess: (data) => {
      qc.setQueryData(["workspace_settings"], data);
    },
  });
}
