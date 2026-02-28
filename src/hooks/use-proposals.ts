import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Proposal, mapProposal, ProposalSection, ProposalStatus } from '@/types';
import { toast } from 'sonner';

export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: async (): Promise<Proposal[]> => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, clients(company_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProposal);
    },
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      title: string;
      sections: ProposalSection[];
      currency: string;
      validUntil?: string | null;
      notes?: string | null;
    }) => {
      const totalAmount = payload.sections.reduce(
        (total, section) =>
          total + section.items.reduce((s, item) => s + item.qty * item.rate, 0),
        0,
      );

      // Generate proposal code: PROP-XXX
      const { count } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true });
      const code = `PROP-${String((count ?? 0) + 1).padStart(3, '0')}`;

      const { error } = await supabase.from('proposals').insert({
        proposal_code: code,
        client_id: payload.clientId,
        title: payload.title,
        sections: payload.sections,
        total_amount: totalAmount,
        currency: payload.currency,
        valid_until: payload.validUntil ?? null,
        notes: payload.notes ?? null,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create proposal: ${error.message}`);
    },
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      sections,
      status,
      validUntil,
      notes,
      currency,
    }: {
      id: string;
      title?: string;
      sections?: ProposalSection[];
      status?: ProposalStatus;
      validUntil?: string | null;
      notes?: string | null;
      currency?: string;
    }) => {
      const row: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (title !== undefined) row.title = title;
      if (sections !== undefined) {
        row.sections = sections;
        row.total_amount = sections.reduce(
          (total, section) =>
            total + section.items.reduce((s, item) => s + item.qty * item.rate, 0),
          0,
        );
      }
      if (status !== undefined) row.status = status;
      if (validUntil !== undefined) row.valid_until = validUntil;
      if (notes !== undefined) row.notes = notes;
      if (currency !== undefined) row.currency = currency;

      const { error } = await supabase.from('proposals').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update proposal: ${error.message}`);
    },
  });
}

export function useDeleteProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete proposal: ${error.message}`);
    },
  });
}

export function useUpdateProposalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProposalStatus }) => {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'viewed') updates.viewed_at = new Date().toISOString();
      if (status === 'accepted') updates.accepted_at = new Date().toISOString();
      const { error } = await supabase.from('proposals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
