import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PortalAccess, mapPortalAccess, toPortalAccessRow } from "@/types";
import { toast } from "sonner";

export function usePortalAccessList() {
  return useQuery({
    queryKey: ["portal_access"],
    queryFn: async (): Promise<PortalAccess[]> => {
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
      const accessToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      const { data, error } = await supabase
        .from("portal_access")
        .insert({
          client_id: values.clientId,
          contact_email: values.contactEmail!,
          contact_name: values.contactName!,
          is_active: values.isActive ?? true,
          access_token: accessToken,
        })
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
