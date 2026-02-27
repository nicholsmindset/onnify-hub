import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Deliverable, mapDeliverable, toDeliverableRow } from "@/types";
import { toast } from "sonner";
import { deliverableStatusEmail } from "@/lib/email-templates";

interface DeliverableFilters {
  assignee?: string;
  market?: string;
  clientId?: string;
}

export function useDeliverables(filters?: DeliverableFilters) {
  return useQuery({
    queryKey: ["deliverables", filters],
    queryFn: async (): Promise<Deliverable[]> => {
      let query = supabase
        .from("deliverables_with_client")
        .select("*")
        .order("due_date", { ascending: true });

      if (filters?.assignee && filters.assignee !== "all") {
        query = query.eq("assigned_to", filters.assignee);
      }
      if (filters?.market && filters.market !== "all") {
        query = query.eq("market", filters.market);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapDeliverable(row as Record<string, unknown>));
    },
  });
}

export function useDeliverable(id: string | undefined) {
  return useQuery({
    queryKey: ["deliverables", id],
    queryFn: async (): Promise<Deliverable> => {
      const { data, error } = await supabase
        .from("deliverables_with_client")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    enabled: !!id,
  });
}

export function useCreateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Deliverable> & { deliverableId?: string }) => {
      const row = toDeliverableRow(values);
      const { data: idData, error: idError } = await supabase.rpc("generate_deliverable_id");
      if (idError) throw idError;
      (row as Record<string, unknown>).deliverable_code = idData;
      const { data, error } = await supabase
        .from("deliverables")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });
}

export function useUpdateDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Deliverable> & { id: string }) => {
      const row = toDeliverableRow(values);
      const { data, error } = await supabase
        .from("deliverables")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapDeliverable(data as Record<string, unknown>);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable updated");
      if (variables.status) {
        supabase.from("activity_logs").insert({
          event_type: "status_change",
          title: `${data.name} moved to ${data.status}`,
          client_id: data.clientId || null,
          client_name: data.clientName || null,
          actor: "agency",
          link_path: data.clientId ? `/clients/${data.clientId}` : "/deliverables",
        }).then(() => {}).catch(() => {});
        // Email client about the status change
        if (data.clientId) {
          supabase.functions.invoke("send-portal-email", {
            body: {
              clientId: data.clientId,
              subject: `Project update: ${data.name}`,
              html: deliverableStatusEmail({ deliverableName: data.name ?? "Deliverable", status: data.status ?? "" }),
            },
          }).catch(() => {});
        }
      }
    },
    onError: (error) => {
      toast.error(`Failed to update deliverable: ${error.message}`);
    },
  });
}

export function useDeleteDeliverable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliverables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast.success("Deliverable deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete deliverable: ${error.message}`);
    },
  });
}
