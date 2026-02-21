import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PortalAccess, mapPortalAccess, toPortalAccessRow } from "@/types";
import { isDemoMode } from "@/lib/demo-data";
import { toast } from "sonner";

export function usePortalAccessList() {
  return useQuery({
    queryKey: ["portal_access"],
    queryFn: async (): Promise<PortalAccess[]> => {
      if (isDemoMode()) {
        return [
          { id: "pa1", clientId: "c1", accessToken: "demo-token-acme-001", contactEmail: "john.tan@acmecorp.sg", contactName: "John Tan", isActive: true, lastAccessedAt: new Date(Date.now() - 86400000).toISOString() },
          { id: "pa2", clientId: "c4", accessToken: "demo-token-nova-001", contactEmail: "rina@novapay.id", contactName: "Rina Dewi", isActive: true },
          { id: "pa3", clientId: "c3", accessToken: "demo-token-tech-001", contactEmail: "mike@techstart.io", contactName: "Mike Chen", isActive: false },
        ];
      }
      const { data, error } = await supabase
        .from("portal_access")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapPortalAccess(row as Record<string, unknown>));
    },
  });
}

export function usePortalAccessByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["portal_access", token],
    queryFn: async (): Promise<PortalAccess | null> => {
      const { data, error } = await supabase
        .from("portal_access")
        .select("*")
        .eq("access_token", token!)
        .eq("is_active", true)
        .single();
      if (error) return null;
      // Update last accessed
      await supabase
        .from("portal_access")
        .update({ last_accessed_at: new Date().toISOString() })
        .eq("access_token", token!);
      return mapPortalAccess(data as Record<string, unknown>);
    },
    enabled: !!token,
  });
}

export function useCreatePortalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<PortalAccess>) => {
      const row = toPortalAccessRow(values);
      // Generate a random token
      (row as Record<string, unknown>).access_token =
        crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const { data, error } = await supabase
        .from("portal_access")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapPortalAccess(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal_access"] });
      toast.success("Portal access created");
    },
    onError: (error) => {
      toast.error(`Failed to create portal access: ${error.message}`);
    },
  });
}

export function useTogglePortalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("portal_access")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal_access"] });
      toast.success("Portal access updated");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

export function useDeletePortalAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portal_access").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal_access"] });
      toast.success("Portal access revoked");
    },
    onError: (error) => {
      toast.error(`Failed to revoke: ${error.message}`);
    },
  });
}
