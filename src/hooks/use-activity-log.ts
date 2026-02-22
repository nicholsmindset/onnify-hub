import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ActivityLog, mapActivityLog, toActivityLogRow } from "@/types";
import { toast } from "sonner";

export function useActivityLog(clientId?: string) {
  return useQuery({
    queryKey: ["activity_log", clientId],
    queryFn: async (): Promise<ActivityLog[]> => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapActivityLog(row as Record<string, unknown>));
    },
    enabled: !!clientId,
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ActivityLog>) => {
      const row = toActivityLogRow(values);
      const { data, error } = await supabase
        .from("activity_log")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapActivityLog(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
    },
    onError: (error) => {
      toast.error(`Failed to log activity: ${error.message}`);
    },
  });
}
