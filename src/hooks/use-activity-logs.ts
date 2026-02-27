import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ActivityLog, mapActivityLog } from "@/types";

export interface ActivityLogWithMeta extends ActivityLog {
  clientName?: string;
  linkPath?: string;
  isRead: boolean;
}

export function mapActivityLogWithMeta(row: Record<string, unknown>): ActivityLogWithMeta {
  const base = mapActivityLog(row);
  return {
    ...base,
    clientName: row.client_name as string | undefined,
    linkPath: row.link_path as string | undefined,
    isRead: (row.is_read as boolean) ?? false,
  };
}

export function useActivityLogs(limit = 30) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["activity_logs", limit],
    queryFn: async (): Promise<ActivityLogWithMeta[]> => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map((row) => mapActivityLogWithMeta(row as Record<string, unknown>));
    },
  });

  // Realtime subscription — invalidate on any change
  useEffect(() => {
    const channel = supabase
      .channel("activity_logs_feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_logs" },
        () => queryClient.invalidateQueries({ queryKey: ["activity_logs"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useUnreadActivityCount() {
  return useQuery({
    queryKey: ["activity_logs_unread"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkAllActivityRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("activity_logs")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs_unread"] });
    },
  });
}

export function useMarkActivityRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("activity_logs")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
      queryClient.invalidateQueries({ queryKey: ["activity_logs_unread"] });
    },
  });
}
