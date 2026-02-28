import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProjectTemplate, mapProjectTemplate } from "@/types";
import { toast } from "sonner";

// ─── Fetch all templates ────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async (): Promise<ProjectTemplate[]> => {
      const { data, error } = await supabase
        .from("project_templates")
        .select("*, template_deliverables(*, template_tasks(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapProjectTemplate);
    },
  });
}

// ─── Create template (with nested deliverables + tasks) ────────────────────

interface NewTemplateTask {
  name: string;
  priority: string;
}

interface NewTemplateDeliverable {
  name: string;
  description?: string;
  tasks: NewTemplateTask[];
}

interface CreateTemplateInput {
  name: string;
  description?: string;
  category: string;
  deliverables: NewTemplateDeliverable[];
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      // 1. Insert the template
      const { data: templateData, error: templateError } = await supabase
        .from("project_templates")
        .insert({
          name: input.name,
          description: input.description || null,
          category: input.category,
        })
        .select()
        .single();
      if (templateError) throw templateError;
      const templateId = templateData.id;

      // 2. Insert deliverables and their tasks in sequence
      for (let i = 0; i < input.deliverables.length; i++) {
        const del = input.deliverables[i];
        const { data: delData, error: delError } = await supabase
          .from("template_deliverables")
          .insert({
            template_id: templateId,
            name: del.name,
            description: del.description || null,
            sort_order: i,
          })
          .select()
          .single();
        if (delError) throw delError;
        const deliverableId = delData.id;

        // 3. Insert tasks for this deliverable
        if (del.tasks && del.tasks.length > 0) {
          const taskRows = del.tasks.map((t) => ({
            template_deliverable_id: deliverableId,
            name: t.name,
            priority: t.priority || "medium",
          }));
          const { error: taskError } = await supabase
            .from("template_tasks")
            .insert(taskRows);
          if (taskError) throw taskError;
        }
      }

      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

// ─── Update template metadata (name/description/category only) ─────────────

interface UpdateTemplateInput {
  id: string;
  name: string;
  description?: string;
  category: string;
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, description, category }: UpdateTemplateInput) => {
      const { error } = await supabase
        .from("project_templates")
        .update({ name, description: description || null, category })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

// ─── Delete template (cascade handles children) ─────────────────────────────

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

// ─── Apply template to a client ─────────────────────────────────────────────

export function useApplyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, clientId }: { templateId: string; clientId: string }) => {
      // 1. Fetch the template with nested deliverables and tasks
      const { data: templateData, error: fetchError } = await supabase
        .from("project_templates")
        .select("*, template_deliverables(*, template_tasks(*))")
        .eq("id", templateId)
        .single();
      if (fetchError) throw fetchError;

      const template = mapProjectTemplate(templateData);
      const deliverables = template.deliverables ?? [];

      for (const templateDel of deliverables) {
        // 2. Generate a real deliverable_code
        const { data: delCode, error: delCodeError } = await supabase.rpc("generate_deliverable_id");
        if (delCodeError) throw delCodeError;

        // 3. Insert a real deliverable
        const { data: realDel, error: realDelError } = await supabase
          .from("deliverables")
          .insert({
            deliverable_code: delCode,
            client_id: clientId,
            name: templateDel.name,
            description: templateDel.description || null,
            status: "Not Started",
            market: "SG",
            // Required fields with sensible defaults
            service_type: "Strategy",
            assigned_to: "",
            priority: "Medium",
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          })
          .select()
          .single();
        if (realDelError) throw realDelError;
        const realDeliverableId = realDel.id;

        // 4. Insert tasks for this deliverable
        const tasks = templateDel.tasks ?? [];
        for (const templateTask of tasks) {
          const { data: taskCode, error: taskCodeError } = await supabase.rpc("generate_task_id");
          if (taskCodeError) throw taskCodeError;

          const { error: taskInsertError } = await supabase
            .from("tasks")
            .insert({
              task_code: taskCode,
              deliverable_id: realDeliverableId,
              client_id: clientId,
              name: templateTask.name,
              priority: templateTask.priority ?? "Medium",
              status: "To Do",
              // Required fields with sensible defaults
              assigned_to: "",
              category: "Strategy",
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            });
          if (taskInsertError) throw taskInsertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Template applied successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply template: ${error.message}`);
    },
  });
}
