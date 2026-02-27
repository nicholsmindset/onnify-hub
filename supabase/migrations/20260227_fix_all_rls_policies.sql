-- ============================================================
-- FIX ALL RLS POLICIES — ONNIFY HUB
-- Paste this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================
-- Each block checks if the table exists before acting.
-- Safe to run multiple times (idempotent).
-- ============================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'clients', 'deliverables', 'invoices', 'tasks',
    'user_profiles', 'content_items', 'ghl_connections',
    'ghl_sync_logs', 'notification_rules', 'notifications',
    'portal_access', 'contacts', 'team_members',
    'activity_logs', 'portal_messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Only act if the table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      -- Create permissive policy if it doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = t
          AND policyname = 'Allow all for anon'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "Allow all for anon" ON public.%I FOR ALL USING (true) WITH CHECK (true)',
          t
        );
        RAISE NOTICE 'Created policy on %', t;
      ELSE
        RAISE NOTICE 'Policy already exists on % — skipped', t;
      END IF;

    ELSE
      RAISE NOTICE 'Table % does not exist — skipped', t;
    END IF;
  END LOOP;
END $$;

-- ─── Verify: show all public tables with RLS status ─────────
SELECT
  tablename,
  rowsecurity                                                          AS rls_enabled,
  (SELECT COUNT(*)
   FROM pg_policies p
   WHERE p.tablename = t.tablename
     AND p.schemaname = t.schemaname)                                  AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
