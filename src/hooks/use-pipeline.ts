import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { mapClient, Client } from '@/types';

export function usePipelineClients() {
  return useQuery({
    queryKey: ['pipeline-clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapClient(row as Record<string, unknown>));
    },
  });
}

export function useUpdateClientStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase
        .from('clients')
        .update({ pipeline_stage: stage })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-clients'] });
    },
  });
}
