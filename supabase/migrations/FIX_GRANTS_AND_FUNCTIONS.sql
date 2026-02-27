-- ============================================================
-- FIX_GRANTS_AND_FUNCTIONS.sql
-- Run in: Supabase Dashboard → SQL Editor
-- Project: xjayfjaewnhfoesmwdkh
-- URL: https://supabase.com/dashboard/project/xjayfjaewnhfoesmwdkh/sql/new
-- ============================================================

-- ============================================
-- 1. GRANT access on original tables
--    (these were created by Lovable without grants)
-- ============================================

GRANT ALL ON TABLE public.clients      TO anon, authenticated;
GRANT ALL ON TABLE public.deliverables TO anon, authenticated;
GRANT ALL ON TABLE public.invoices     TO anon, authenticated;
GRANT ALL ON TABLE public.tasks        TO anon, authenticated;

-- Grant portal_access if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'portal_access'
  ) THEN
    EXECUTE 'GRANT ALL ON TABLE public.portal_access TO anon, authenticated';
    RAISE NOTICE 'Granted on portal_access';
  ELSE
    RAISE NOTICE 'portal_access does not exist — skipped';
  END IF;
END $$;

-- ============================================
-- 2. Create / replace ID-generation functions
--    using actual column names from the DB:
--      clients.client_code
--      deliverables.deliverable_code
--      invoices.invoice_code
--      tasks.task_code
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_client_id(p_market text)
RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num FROM public.clients WHERE market = p_market;
  RETURN 'OW-' || p_market || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_deliverable_id()
RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(deliverable_code FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num FROM public.deliverables;
  RETURN 'DEL-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_invoice_id()
RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_code FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num FROM public.invoices
  WHERE invoice_code LIKE 'INV-' || EXTRACT(YEAR FROM now())::text || '%';
  RETURN 'INV-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_task_id()
RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_code FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num FROM public.tasks;
  RETURN 'TSK-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Grant execute on all functions to anon + authenticated
GRANT EXECUTE ON FUNCTION public.generate_client_id(text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_deliverable_id()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_invoice_id()      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_task_id()         TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = 'generate_content_id'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.generate_content_id() TO anon, authenticated';
    RAISE NOTICE 'Granted execute on generate_content_id';
  ELSE
    RAISE NOTICE 'generate_content_id does not exist — skipped';
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
