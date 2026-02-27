-- Phase 4: Files Hub
-- portal_files table for file sharing between agency and clients
CREATE TABLE IF NOT EXISTS public.portal_files (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_access_id  uuid REFERENCES public.portal_access(id) ON DELETE CASCADE,
  file_name         text NOT NULL,
  file_url          text NOT NULL,
  file_size         bigint,
  file_type         text,                           -- MIME type
  uploaded_by       text NOT NULL,                  -- 'agency' | 'client'
  category          text DEFAULT 'general',          -- 'general' | 'onboarding_asset' | 'deliverable'
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE public.portal_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all portal_files" ON public.portal_files FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.portal_files TO anon, authenticated;

-- Profile: extended agency user profile table
-- Linked to Supabase Auth users via id
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text,
  job_title     text,
  bio           text,
  avatar_url    text,
  linkedin_url  text,
  twitter_url   text,
  instagram_url text,
  website_url   text,
  phone         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Each user can read/write only their own profile
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
GRANT ALL ON public.profiles TO authenticated;

-- Storage bucket for portal files
-- NOTE: Run this separately in Supabase dashboard SQL editor or Storage UI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('portal-files', 'portal-files', true)
-- ON CONFLICT (id) DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;
