import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Invoice, mapInvoice, toInvoiceRow } from "@/types";
import { toast } from "sonner";

interface InvoiceFilters {
  status?: string;
  market?: string;
  clientId?: string;
}

export function useInvoices(filters?: InvoiceFilters) {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async (): Promise<Invoice[]> => {
      let query = supabase
        .from("invoices_with_client")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.market && filters.market !== "all") {
        query = query.eq("market", filters.market);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapInvoice(row as Record<string, unknown>));
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Invoice> & { invoiceId?: string }) => {
      const row = toInvoiceRow(values);
      const { data: idData, error: idError } = await supabase.rpc("generate_invoice_id");
      if (idError) throw idError;
      (row as Record<string, unknown>).invoice_code = idData;
      const { data, error } = await supabase
        .from("invoices")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapInvoice(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Invoice> & { id: string }) => {
      const row = toInvoiceRow(values);
      const { data, error } = await supabase
        .from("invoices")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapInvoice(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
    onError: (error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });
}
