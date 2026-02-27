import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface PortalTeamMember {
  id: string;
  portalAccessId: string;
  name: string;
  email: string;
  role: "owner" | "member";
  inviteToken: string;
  acceptedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

function mapTeamMember(row: Record<string, unknown>): PortalTeamMember {
  return {
    id: row.id as string,
    portalAccessId: row.portal_access_id as string,
    name: row.name as string,
    email: row.email as string,
    role: (row.role as "owner" | "member") ?? "member",
    inviteToken: row.invite_token as string,
    acceptedAt: (row.accepted_at as string) ?? null,
    lastSeenAt: (row.last_seen_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

/** List all team members for a portal */
export function usePortalTeamMembers(portalAccessId?: string) {
  return useQuery({
    queryKey: ["portal_team_members", portalAccessId],
    queryFn: async (): Promise<PortalTeamMember[]> => {
      const { data, error } = await supabase
        .from("portal_team_members")
        .select("*")
        .eq("portal_access_id", portalAccessId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((r) => mapTeamMember(r as Record<string, unknown>));
    },
    enabled: !!portalAccessId,
  });
}

/** Validate an invite token and accept the invite on first visit */
export function useValidateInviteToken(inviteToken?: string) {
  return useQuery({
    queryKey: ["portal_team_member_token", inviteToken],
    queryFn: async (): Promise<PortalTeamMember | null> => {
      const { data, error } = await supabase
        .from("portal_team_members")
        .select("*")
        .eq("invite_token", inviteToken!)
        .maybeSingle();
      if (error || !data) return null;
      const member = mapTeamMember(data as Record<string, unknown>);
      // Accept invite on first visit
      if (!member.acceptedAt) {
        await supabase
          .from("portal_team_members")
          .update({
            accepted_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", member.id);
      }
      return member;
    },
    enabled: !!inviteToken,
    staleTime: 5 * 60 * 1000,
  });
}

/** Update member's last_seen_at timestamp */
export function useUpdateMemberLastSeen() {
  return useMutation({
    mutationFn: async (memberId: string) => {
      await supabase
        .from("portal_team_members")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", memberId);
    },
  });
}

/** Invite a new team member */
export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      portalAccessId,
      name,
      email,
    }: {
      portalAccessId: string;
      name: string;
      email: string;
    }): Promise<PortalTeamMember> => {
      const { data, error } = await supabase
        .from("portal_team_members")
        .insert({ portal_access_id: portalAccessId, name, email, role: "member" })
        .select()
        .single();
      if (error) throw error;
      return mapTeamMember(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portal_team_members", data.portalAccessId] });
    },
  });
}

/** Remove a team member */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      portalAccessId,
    }: {
      id: string;
      portalAccessId: string;
    }): Promise<string> => {
      const { error } = await supabase
        .from("portal_team_members")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return portalAccessId;
    },
    onSuccess: (portalAccessId) => {
      queryClient.invalidateQueries({ queryKey: ["portal_team_members", portalAccessId] });
    },
  });
}
