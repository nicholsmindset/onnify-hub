import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  NotificationRule, mapNotificationRule, toNotificationRuleRow,
  Notification, mapNotification,
} from "@/types";
import { toast } from "sonner";

export function useNotificationRules() {
  return useQuery({
    queryKey: ["notification_rules"],
    queryFn: async (): Promise<NotificationRule[]> => {
      const { data, error } = await supabase
        .from("notification_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapNotificationRule(row as Record<string, unknown>));
    },
  });
}

export function useCreateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<NotificationRule>) => {
      const row = toNotificationRuleRow(values);
      const { data, error } = await supabase
        .from("notification_rules")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapNotificationRule(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_rules"] });
      toast.success("Notification rule created");
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });
}

export function useUpdateNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<NotificationRule> & { id: string }) => {
      const row = toNotificationRuleRow(values);
      const { data, error } = await supabase
        .from("notification_rules")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapNotificationRule(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_rules"] });
      toast.success("Rule updated");
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });
}

export function useDeleteNotificationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notification_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_rules"] });
      toast.success("Rule deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });
}

export function useNotifications(userEmail?: string) {
  return useQuery({
    queryKey: ["notifications", userEmail],
    queryFn: async (): Promise<Notification[]> => {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (userEmail) {
        query = query.eq("user_email", userEmail);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapNotification(row as Record<string, unknown>));
    },
    enabled: !!userEmail,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userEmail: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_email", userEmail)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}
