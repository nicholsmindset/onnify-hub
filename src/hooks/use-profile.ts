import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface AgencyProfile {
  id: string;
  fullName: string | null;
  jobTitle: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapProfile(row: Record<string, unknown>): AgencyProfile {
  return {
    id: String(row.id),
    fullName: row.full_name ? String(row.full_name) : null,
    jobTitle: row.job_title ? String(row.job_title) : null,
    bio: row.bio ? String(row.bio) : null,
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    linkedinUrl: row.linkedin_url ? String(row.linkedin_url) : null,
    twitterUrl: row.twitter_url ? String(row.twitter_url) : null,
    instagramUrl: row.instagram_url ? String(row.instagram_url) : null,
    websiteUrl: row.website_url ? String(row.website_url) : null,
    phone: row.phone ? String(row.phone) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<AgencyProfile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProfile(data as Record<string, unknown>) : null;
    },
    enabled: !!userId,
  });
}

export function useUpsertProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<AgencyProfile> & { id: string }) => {
      const row: Record<string, unknown> = {
        id: values.id,
        full_name: values.fullName ?? null,
        job_title: values.jobTitle ?? null,
        bio: values.bio ?? null,
        avatar_url: values.avatarUrl ?? null,
        linkedin_url: values.linkedinUrl ?? null,
        twitter_url: values.twitterUrl ?? null,
        instagram_url: values.instagramUrl ?? null,
        website_url: values.websiteUrl ?? null,
        phone: values.phone ?? null,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("profiles")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return mapProfile(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile", data.id] });
      toast.success("Profile saved");
    },
    onError: (error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Add cache-buster so the browser shows the new image
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return { avatarUrl, profile: mapProfile(data as Record<string, unknown>) };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.userId] });
      toast.success("Avatar updated");
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}
