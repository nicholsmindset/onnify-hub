import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface CalendarDeliverable {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  clientName?: string;
}

export interface CalendarTask {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  clientName?: string;
}

export function useCalendarItems(year: number, month: number) {
  // month is 1-indexed (1=January, 12=December)
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]; // last day of month

  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: async () => {
      const [delivRes, taskRes] = await Promise.all([
        supabase
          .from('deliverables_with_client')
          .select('id, name, due_date, status, client_name')
          .gte('due_date', firstDay)
          .lte('due_date', lastDay),
        supabase
          .from('tasks_with_relations')
          .select('id, name, due_date, status, client_name')
          .gte('due_date', firstDay)
          .lte('due_date', lastDay)
          .not('due_date', 'is', null),
      ]);

      // Graceful fallback: if views fail, try base tables
      let delivData = delivRes.data;
      if (delivRes.error || !delivData) {
        const fallback = await supabase
          .from('deliverables')
          .select('id, name, due_date, status')
          .gte('due_date', firstDay)
          .lte('due_date', lastDay);
        delivData = fallback.data ?? [];
      }

      let taskData = taskRes.data;
      if (taskRes.error || !taskData) {
        const fallback = await supabase
          .from('tasks')
          .select('id, name, due_date, status')
          .gte('due_date', firstDay)
          .lte('due_date', lastDay)
          .not('due_date', 'is', null);
        taskData = fallback.data ?? [];
      }

      const deliverables: CalendarDeliverable[] = (delivData ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        dueDate: row.due_date,
        status: row.status,
        clientName: row.client_name ?? undefined,
      }));

      const tasks: CalendarTask[] = (taskData ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        dueDate: row.due_date,
        status: row.status,
        clientName: row.client_name ?? undefined,
      }));

      return { deliverables, tasks };
    },
  });
}
