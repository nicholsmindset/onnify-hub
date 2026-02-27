-- Fix: Create portal_files table with correct RLS if not already applied
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create the portal_files table
CREATE TABLE IF NOT EXISTS public.portal_files (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_access_id  uuid REFERENCES public.portal_access(id) ON DELETE CASCADE,
  file_name         text NOT NULL,
  file_url          text NOT NULL,
  file_size         bigint,
  file_type         text,
  uploaded_by       text NOT NULL,
  category          text DEFAULT 'general',
  created_at        timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.portal_files ENABLE ROW LEVEL SECURITY;

-- 3. Drop and recreate policy (idempotent)
DROP POLICY IF EXISTS "Allow all portal_files" ON public.portal_files;
CREATE POLICY "Allow all portal_files" ON public.portal_files
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Grant access to anon + authenticated roles
GRANT ALL ON public.portal_files TO anon, authenticated;

-- 5. Create storage bucket for portal files (run separately if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portal-files', 'portal-files', true)
-- ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'portal_files';
