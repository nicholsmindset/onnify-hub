import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TimeEntry, mapTimeEntry, toTimeEntryRow } from '@/types';

interface TimeEntryFilters {
  clientId?: string;
  taskId?: string;
  deliverableId?: string;
}

export function useTimeEntries(filters: TimeEntryFilters = {}) {
  return useQuery({
    queryKey: ['time-entries', filters],
    queryFn: async () => {
      let q = supabase.from('time_entries').select('*').order('date', { ascending: false });
      if (filters.clientId) q = q.eq('client_id', filters.clientId);
      if (filters.taskId) q = q.eq('task_id', filters.taskId);
      if (filters.deliverableId) q = q.eq('deliverable_id', filters.deliverableId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapTimeEntry);
    },
    enabled: !!(filters.clientId || filters.taskId || filters.deliverableId),
  });
}

export function useLogTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
      const { error } = await supabase.from('time_entries').insert(toTimeEntryRow(entry));
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
