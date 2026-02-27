import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PortalMessage, mapPortalMessage, toPortalMessageRow } from "@/types";
import { toast } from "sonner";
import { portalMessageEmail } from "@/lib/email-templates";

export function usePortalMessages(clientId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["portal_messages", clientId],
    queryFn: async (): Promise<PortalMessage[]> => {
      const { data, error } = await supabase
        .from("portal_messages")
        .select("*")
        .eq("client_id", clientId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapPortalMessage(row as Record<string, unknown>));
    },
    enabled: !!clientId,
  });

  // Realtime subscription — invalidate on INSERT
  useEffect(() => {
    if (!clientId) return;
    const channel = supabase
      .channel(`portal_messages:${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "portal_messages", filter: `client_id=eq.${clientId}` },
        () => queryClient.invalidateQueries({ queryKey: ["portal_messages", clientId] })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "portal_messages", filter: `client_id=eq.${clientId}` },
        () => queryClient.invalidateQueries({ queryKey: ["portal_messages", clientId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clientId, queryClient]);

  return query;
}

/** Count unread messages sent by `senderType` (i.e. the OTHER party's messages that haven't been read) */
export function useUnreadPortalMessageCounts() {
  return useQuery({
    queryKey: ["portal_messages_unread_counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("portal_messages")
        .select("client_id")
        .eq("sender_type", "client")
        .eq("is_read", false);
      if (error) throw error;
      return (data || []).reduce((acc, row) => {
        const cid = row.client_id as string;
        acc[cid] = (acc[cid] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    },
  });
}

export function useDeliverableFeedback(deliverableId?: string) {
  return useQuery({
    queryKey: ["portal_messages", "deliverable", deliverableId],
    queryFn: async (): Promise<PortalMessage[]> => {
      const { data, error } = await supabase
        .from("portal_messages")
        .select("*")
        .eq("deliverable_id", deliverableId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((row) => mapPortalMessage(row as Record<string, unknown>));
    },
    enabled: !!deliverableId,
  });
}

/** Mark all messages from `senderType` as read for a given client */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, senderType }: { clientId: string; senderType: "client" | "agency" }) => {
      const { error } = await supabase
        .from("portal_messages")
        .update({ is_read: true })
        .eq("client_id", clientId)
        .eq("sender_type", senderType)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portal_messages", variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ["portal_messages_unread_counts"] });
    },
  });
}

export function useSendPortalMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<PortalMessage> & { clientName?: string }) => {
      const row = toPortalMessageRow(values);
      const { data, error } = await supabase
        .from("portal_messages")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      const msg = mapPortalMessage(data as Record<string, unknown>);

      // Log to activity_logs so Dashboard feed picks it up
      if (values.senderType === "client") {
        await supabase.from("activity_logs").insert({
          client_id: values.clientId || null,
          client_name: values.clientName || null,
          entity_type: "contact",
          entity_id: msg.id,
          action: "commented",
          description: `${values.senderName} sent a portal message`,
          performed_by: values.senderName || "client",
          link_path: `/portal-admin`,
        });
        queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
      }

      return msg;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portal_messages", data.clientId] });
      queryClient.invalidateQueries({ queryKey: ["portal_messages_unread_counts"] });
      if (data.deliverableId) {
        queryClient.invalidateQueries({ queryKey: ["portal_messages", "deliverable", data.deliverableId] });
      }
      // Email client when agency sends a message
      if (data.senderType === "agency" && data.clientId) {
        const preview = (data.content ?? "").slice(0, 200);
        supabase.functions.invoke("send-portal-email", {
          body: {
            clientId: data.clientId,
            subject: "New message from your project team",
            html: portalMessageEmail({ senderName: data.senderName ?? "Your project team", preview }),
          },
        }).catch(() => {});
      }
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}
