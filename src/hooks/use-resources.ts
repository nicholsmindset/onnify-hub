import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Resource, mapResource } from '@/types';

interface ResourceFilters {
  category?: string;
  isPublic?: boolean;
}

export function useResources(filters: ResourceFilters = {}) {
  return useQuery({
    queryKey: ['resources', filters],
    queryFn: async () => {
      let q = supabase.from('resources').select('*').order('created_at', { ascending: false });
      if (filters.category && filters.category !== 'all') q = q.eq('category', filters.category);
      if (filters.isPublic !== undefined) q = q.eq('is_public', filters.isPublic);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapResource);
    },
  });
}

export function useUploadResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      file: File;
      name: string;
      description?: string;
      category: string;
      uploadedBy: string;
    }) => {
      const { file, name, description, category, uploadedBy } = payload;
      // Upload file to storage
      const filePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('resources').getPublicUrl(filePath);
      const fileUrl = urlData.publicUrl;

      // Insert DB record
      const { error: dbError } = await supabase.from('resources').insert({
        name,
        description: description ?? null,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        category,
        is_public: false,
        uploaded_by: uploadedBy,
        tags: [],
      });
      if (dbError) throw dbError;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
      const row: any = {};
      if (updates.name !== undefined) row.name = updates.name;
      if (updates.description !== undefined) row.description = updates.description;
      if (updates.category !== undefined) row.category = updates.category;
      if (updates.isPublic !== undefined) row.is_public = updates.isPublic;
      if (updates.tags !== undefined) row.tags = updates.tags;
      const { error } = await supabase.from('resources').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['resources'] }),
  });
}
