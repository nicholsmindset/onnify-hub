import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TeamMember, mapTeamMember, toTeamMemberRow } from "@/types";
import { toast } from "sonner";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []).map((row) => mapTeamMember(row as Record<string, unknown>));
    },
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<TeamMember>) => {
      const row = toTeamMemberRow(values);
      const { data, error } = await supabase
        .from("team_members")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return mapTeamMember(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member added");
    },
    onError: (error) => {
      toast.error(`Failed to add team member: ${error.message}`);
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<TeamMember> & { id: string }) => {
      const row = toTeamMemberRow(values);
      const { data, error } = await supabase
        .from("team_members")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapTeamMember(data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member updated");
    },
    onError: (error) => {
      toast.error(`Failed to update team member: ${error.message}`);
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove team member: ${error.message}`);
    },
  });
}
