import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Contact, mapContact, toContactRow } from "@/types";
import { toast } from "sonner";

export function useContacts(clientId?: string) {
  return useQuery({
    queryKey: ["contacts", clientId],
    queryFn: async (): Promise<Contact[]> => {
      let query = supabase
        .from("contacts")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("name");

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapContact(row as Record<string, unknown>));
    },
    enabled: !!clientId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Contact>) => {
      const row = toContactRow(values);
      const { data, error } = await supabase
        .from("contacts")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapContact(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added");
    },
    onError: (error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Contact> & { id: string }) => {
      const row = toContactRow(values);
      const { data, error } = await supabase
        .from("contacts")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapContact(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated");
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });
}
