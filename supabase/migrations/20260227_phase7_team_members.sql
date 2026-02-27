-- Phase 7: Client Portal Team Members
-- Run in Supabase Dashboard → SQL Editor

-- Table: portal_team_members
CREATE TABLE IF NOT EXISTS public.portal_team_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_access_id uuid REFERENCES public.portal_access(id) ON DELETE CASCADE,
  name             text NOT NULL,
  email            text NOT NULL,
  role             text NOT NULL DEFAULT 'member',    -- 'owner' | 'member'
  invite_token     text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at      timestamptz,                       -- null = pending invite
  last_seen_at     timestamptz,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE public.portal_team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all portal_team_members" ON public.portal_team_members;
CREATE POLICY "Allow all portal_team_members" ON public.portal_team_members
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.portal_team_members TO anon, authenticated;

-- Add member_id column to portal_messages so messages show correct sender name
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.portal_team_members(id);

-- Verify
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'portal_team_members';
