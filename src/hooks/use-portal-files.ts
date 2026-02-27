import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { newFileEmail } from "@/lib/email-templates";

export interface PortalFile {
  id: string;
  portalAccessId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  fileType: string | null;
  uploadedBy: "agency" | "client";
  category: string;
  createdAt: string;
}

function mapPortalFile(row: Record<string, unknown>): PortalFile {
  return {
    id: String(row.id),
    portalAccessId: String(row.portal_access_id),
    fileName: String(row.file_name),
    fileUrl: String(row.file_url),
    fileSize: row.file_size != null ? Number(row.file_size) : null,
    fileType: row.file_type != null ? String(row.file_type) : null,
    uploadedBy: String(row.uploaded_by) as "agency" | "client",
    category: String(row.category ?? "general"),
    createdAt: String(row.created_at),
  };
}

export function usePortalFiles(portalAccessId?: string) {
  return useQuery({
    queryKey: ["portal_files", portalAccessId],
    queryFn: async (): Promise<PortalFile[]> => {
      const { data, error } = await supabase
        .from("portal_files")
        .select("*")
        .eq("portal_access_id", portalAccessId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((row) => mapPortalFile(row as Record<string, unknown>));
    },
    enabled: !!portalAccessId,
  });
}

export function useUploadPortalFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      portalAccessId,
      file,
      uploadedBy,
      category = "general",
    }: {
      portalAccessId: string;
      file: File;
      uploadedBy: "agency" | "client";
      category?: string;
    }) => {
      // Upload to Supabase Storage
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${portalAccessId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("portal-files")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portal-files")
        .getPublicUrl(path);

      // Insert DB record
      const { data, error } = await supabase
        .from("portal_files")
        .insert({
          portal_access_id: portalAccessId,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: uploadedBy,
          category,
        })
        .select()
        .single();
      if (error) throw error;
      return mapPortalFile(data as Record<string, unknown>);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portal_files", variables.portalAccessId] });
      toast.success("File uploaded");
      // Email client when agency shares a file
      if (variables.uploadedBy === "agency") {
        supabase.functions.invoke("send-portal-email", {
          body: {
            portalAccessId: variables.portalAccessId,
            subject: `New file shared: ${data.fileName}`,
            html: newFileEmail({ fileName: data.fileName, uploadedBy: "Your project team" }),
          },
        }).catch(() => {});
      }
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useDeletePortalFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      portalAccessId,
      fileUrl,
    }: {
      id: string;
      portalAccessId: string;
      fileUrl: string;
    }) => {
      // Remove from storage — extract path after bucket name
      try {
        const url = new URL(fileUrl);
        const marker = "/portal-files/";
        const idx = url.pathname.indexOf(marker);
        if (idx !== -1) {
          const storagePath = url.pathname.slice(idx + marker.length);
          await supabase.storage.from("portal-files").remove([storagePath]);
        }
      } catch {
        // Ignore storage errors — still delete the DB record
      }
      const { error } = await supabase.from("portal_files").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portal_files", variables.portalAccessId] });
      toast.success("File removed");
    },
    onError: (error) => {
      toast.error(`Failed to delete file: ${error.message}`);
    },
  });
}

/** Format bytes to human-readable size */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
