-- ============================================================
-- PORTAL PHASES 1–3 + 8: Real-time chat, Onboarding, Activity Feed
-- Paste in Supabase Dashboard → SQL Editor → Run
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ── Phase 1: Add columns to portal_messages ──────────────────
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.portal_messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- ── Phase 2: Client onboarding table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.client_onboarding (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_access_id     uuid REFERENCES public.portal_access(id) ON DELETE CASCADE UNIQUE,
  current_step         int DEFAULT 1,
  completed_at         timestamptz,
  -- About
  industry             text,
  website_url          text,
  business_description text,
  target_audience      text,
  -- Brand
  primary_color        text,
  secondary_color      text,
  font_preferences     text,
  brand_voice          text,
  brand_dos            text,
  brand_donts          text,
  -- Competitors (JSON array: [{name, url, notes}])
  competitors          jsonb DEFAULT '[]',
  -- Goals
  goals                text,
  priority_1           text,
  priority_2           text,
  priority_3           text,
  communication_style  text,
  additional_notes     text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all" ON public.client_onboarding FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT ALL ON public.client_onboarding TO anon, authenticated;

-- ── Phase 8: Add is_read to activity_logs ────────────────────
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS link_path text;

-- ── Verify ───────────────────────────────────────────────────
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'portal_messages'
  AND column_name IN ('is_read', 'attachment_url')
ORDER BY column_name;

SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'client_onboarding';
