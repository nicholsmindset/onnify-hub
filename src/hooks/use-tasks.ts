import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Task, mapTask, toTaskRow } from "@/types";
import { isDemoMode, DEMO_TASKS } from "@/lib/demo-data";
import { toast } from "sonner";

interface TaskFilters {
  assignee?: string;
  category?: string;
  clientId?: string;
}

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async (): Promise<Task[]> => {
      if (isDemoMode()) {
        let results = [...DEMO_TASKS];
        if (filters?.assignee && filters.assignee !== "all") results = results.filter(t => t.assignedTo === filters.assignee);
        if (filters?.category && filters.category !== "all") results = results.filter(t => t.category === filters.category);
        if (filters?.clientId) results = results.filter(t => t.clientId === filters.clientId);
        return results;
      }

      let query = supabase
        .from("tasks_with_relations")
        .select("*")
        .order("due_date", { ascending: true });

      if (filters?.assignee && filters.assignee !== "all") {
        query = query.eq("assigned_to", filters.assignee);
      }
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row) => mapTask(row as Record<string, unknown>));
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Task> & { taskId?: string }) => {
      const row = toTaskRow(values);
      if (values.taskId) {
        (row as Record<string, unknown>).task_id = values.taskId;
      }
      const { data, error } = await supabase
        .from("tasks")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapTask(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<Task> & { id: string }) => {
      const row = toTaskRow(values);
      const { data, error } = await supabase
        .from("tasks")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapTask(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });
}
