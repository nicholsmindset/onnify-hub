-- ============================================================
-- CREATE MISSING TABLES + VIEWS + GRANTS
-- Paste in: Supabase Dashboard → SQL Editor → Run
-- Safe to run multiple times (idempotent)
-- ============================================================

-- ── 1. portal_access table ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portal_access (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  access_token     text UNIQUE NOT NULL,
  contact_email    text NOT NULL,
  contact_name     text NOT NULL,
  is_active        boolean DEFAULT true,
  last_accessed_at timestamptz,
  created_at       timestamptz DEFAULT now()
);

-- ── 2. Recreate views (drop first so we can redefine safely) ─
DROP VIEW IF EXISTS public.tasks_with_relations;
DROP VIEW IF EXISTS public.invoices_with_client;
DROP VIEW IF EXISTS public.deliverables_with_client;

CREATE VIEW public.deliverables_with_client WITH (security_invoker = on) AS
  SELECT d.*, c.company_name AS client_name
  FROM public.deliverables d
  LEFT JOIN public.clients c ON d.client_id = c.id;

CREATE VIEW public.invoices_with_client WITH (security_invoker = on) AS
  SELECT i.*, c.company_name AS client_name
  FROM public.invoices i
  LEFT JOIN public.clients c ON i.client_id = c.id;

CREATE VIEW public.tasks_with_relations WITH (security_invoker = on) AS
  SELECT t.*,
         c.company_name AS client_name,
         del.name       AS deliverable_name
  FROM public.tasks t
  LEFT JOIN public.clients     c   ON t.client_id     = c.id
  LEFT JOIN public.deliverables del ON t.deliverable_id = del.id;

-- ── 3. Grant SELECT on views to anon + authenticated ──────
GRANT SELECT ON public.deliverables_with_client TO anon, authenticated;
GRANT SELECT ON public.invoices_with_client     TO anon, authenticated;
GRANT SELECT ON public.tasks_with_relations     TO anon, authenticated;

-- ── 4. Enable RLS + permissive policy on portal_access ────
ALTER TABLE public.portal_access ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'portal_access'
      AND policyname = 'Allow all for anon'
  ) THEN
    CREATE POLICY "Allow all for anon"
      ON public.portal_access FOR ALL USING (true) WITH CHECK (true);
    RAISE NOTICE 'Created RLS policy on portal_access';
  ELSE
    RAISE NOTICE 'RLS policy on portal_access already exists — skipped';
  END IF;
END $$;

-- ── 5. Verify ─────────────────────────────────────────────
SELECT
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('deliverables_with_client', 'invoices_with_client', 'tasks_with_relations')
ORDER BY viewname;

SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'portal_access';
