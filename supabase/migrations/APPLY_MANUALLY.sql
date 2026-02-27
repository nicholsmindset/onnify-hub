-- ============================================================
-- APPLY THIS IN: Supabase Dashboard → SQL Editor
-- Project: vjezrfpnknkfehcwrlfq (onnify-hub)
-- Fixes: BUG-004 (content_items missing) + BUG-006 (portal_messages missing)
-- ============================================================

-- ============================================
-- ENSURE update_updated_at() EXISTS
-- (idempotent — safe to run even if already present)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- CONTENT PIPELINE (migration 003)
-- ============================================

CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('Blog', 'Social Post', 'Email Campaign', 'Video', 'Case Study', 'Newsletter')),
  platform text CHECK (platform IN ('Website', 'Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'Email', 'TikTok')),
  status text NOT NULL DEFAULT 'Ideation' CHECK (status IN ('Ideation', 'Draft', 'Review', 'Approved', 'Scheduled', 'Published')),
  assigned_to text NOT NULL,
  due_date date NOT NULL,
  publish_date date,
  content_body text,
  file_link text,
  notes text,
  market text NOT NULL CHECK (market IN ('SG', 'ID', 'US')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION generate_content_id()
RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(content_id FROM '[0-9]+$') AS integer)), 0) + 1
  INTO next_num FROM content_items;
  RETURN 'CNT-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE VIEW content_with_client WITH (security_invoker=on) AS
  SELECT ci.*, c.company_name AS client_name
  FROM content_items ci
  LEFT JOIN clients c ON ci.client_id = c.id;

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON content_items FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- GHL PIPELINE SYNC (migration 003)
-- ============================================

CREATE TABLE IF NOT EXISTS ghl_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  api_key text,
  location_id text,
  sync_enabled boolean DEFAULT false,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'disconnected' CHECK (sync_status IN ('connected', 'disconnected', 'syncing', 'error')),
  contacts_synced integer DEFAULT 0,
  pipelines_synced integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER ghl_connections_updated_at BEFORE UPDATE ON ghl_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ghl_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES ghl_connections(id) ON DELETE CASCADE,
  sync_type text NOT NULL CHECK (sync_type IN ('contacts', 'pipelines', 'opportunities', 'full')),
  status text NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  records_processed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE OR REPLACE VIEW ghl_connections_with_client WITH (security_invoker=on) AS
  SELECT g.*, c.company_name AS client_name, c.market
  FROM ghl_connections g
  LEFT JOIN clients c ON g.client_id = c.id;

ALTER TABLE ghl_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghl_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON ghl_connections FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON ghl_sync_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- NOTIFICATIONS (migration 003)
-- ============================================

CREATE TABLE IF NOT EXISTS notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('overdue_deliverable', 'overdue_invoice', 'status_change', 'upcoming_due', 'new_assignment', 'client_onboarding')),
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'in_app', 'both')),
  recipients text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  conditions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  CREATE TRIGGER notification_rules_updated_at BEFORE UPDATE ON notification_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON notification_rules FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON notifications FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed notification rules if empty
INSERT INTO notification_rules (name, trigger_type, channel, recipients, is_active)
SELECT * FROM (VALUES
  ('Overdue Deliverables Alert', 'overdue_deliverable', 'both', ARRAY['Robert', 'Lina'], true),
  ('Overdue Invoice Reminder', 'overdue_invoice', 'email', ARRAY['Robert'], true),
  ('Upcoming Due Dates (3 days)', 'upcoming_due', 'in_app', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('New Task Assignment', 'new_assignment', 'both', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('Client Onboarding Started', 'client_onboarding', 'email', ARRAY['Robert'], true)
) AS v(name, trigger_type, channel, recipients, is_active)
WHERE NOT EXISTS (SELECT 1 FROM notification_rules LIMIT 1);

-- ============================================
-- CONTACTS (migration 004)
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'other' CHECK (role IN ('primary', 'marketing', 'finance', 'executive', 'technical', 'other')),
  title TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);

DO $$ BEGIN
  CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON contacts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TEAM MEMBERS (migration 004)
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'specialist' CHECK (role IN ('owner', 'manager', 'specialist', 'freelancer')),
  title TEXT,
  weekly_capacity_hours INTEGER DEFAULT 40,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  market TEXT CHECK (market IN ('SG', 'ID', 'US')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON team_members FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed team members if empty
INSERT INTO team_members (name, email, role, title, weekly_capacity_hours, hourly_rate, market, is_active)
SELECT * FROM (VALUES
  ('Robert', 'robert@onnify.com', 'owner', 'Founder & CEO', 40, 150.00, 'SG', true),
  ('Lina', 'lina@onnify.com', 'manager', 'Operations Manager', 40, 80.00, 'SG', true),
  ('Freelancer', 'freelancer@onnify.com', 'freelancer', 'Contract Specialist', 20, 50.00, NULL, true)
) AS v(name, email, role, title, weekly_capacity_hours, hourly_rate, market, is_active)
WHERE NOT EXISTS (SELECT 1 FROM team_members LIMIT 1);

-- ============================================
-- ACTIVITY LOGS (migration 004)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'deliverable', 'invoice', 'task', 'content', 'contact')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented', 'note_added')),
  description TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_client ON activity_logs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PORTAL MESSAGES (migration 004) — BUG-006
-- ============================================

CREATE TABLE IF NOT EXISTS portal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'agency')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_messages_client ON portal_messages(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_portal_messages_deliverable ON portal_messages(deliverable_id);

ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON portal_messages FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- GRANT TABLE ACCESS TO ANON + AUTHENTICATED
-- Run this if you see "permission denied for table X"
-- ============================================

GRANT ALL ON TABLE public.content_items       TO anon, authenticated;
GRANT ALL ON TABLE public.ghl_connections     TO anon, authenticated;
GRANT ALL ON TABLE public.ghl_sync_logs       TO anon, authenticated;
GRANT ALL ON TABLE public.notification_rules  TO anon, authenticated;
GRANT ALL ON TABLE public.notifications       TO anon, authenticated;
GRANT ALL ON TABLE public.contacts            TO anon, authenticated;
GRANT ALL ON TABLE public.team_members        TO anon, authenticated;
GRANT ALL ON TABLE public.activity_logs       TO anon, authenticated;
GRANT ALL ON TABLE public.portal_messages     TO anon, authenticated;
