import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientReport, mapClientReport, toClientReportRow } from "@/types";
import { toast } from "sonner";

export function useClientReports(clientId?: string) {
  return useQuery({
    queryKey: ["client-reports", clientId],
    queryFn: async (): Promise<ClientReport[]> => {
      let query = supabase
        .from("client_reports_with_client")
        .select("*")
        .order("month", { ascending: false });

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapClientReport(row as Record<string, unknown>));
    },
  });
}

export function useCreateClientReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ClientReport> & { reportId?: string }) => {
      const row = toClientReportRow(values);
      if (values.reportId) {
        (row as Record<string, unknown>).report_id = values.reportId;
      }
      const { data, error } = await supabase
        .from("client_reports")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapClientReport(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-reports"] });
      toast.success("Report created");
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    },
  });
}

export function useUpdateClientReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ClientReport> & { id: string }) => {
      const row = toClientReportRow(values);
      const { data, error } = await supabase
        .from("client_reports")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapClientReport(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-reports"] });
      toast.success("Report updated");
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });
}
