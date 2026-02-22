-- ONNIFY-HUB Phase 4: Contacts, Team, Activity Logs, Portal Messages
-- Run this after 003_auth_and_new_modules.sql
-- Uses IF NOT EXISTS so safe to run even if some tables already exist

-- ============================================
-- CONTACTS (Client contacts management)
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
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TEAM MEMBERS
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
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- ACTIVITY LOGS
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

-- ============================================
-- PORTAL MESSAGES (Client-agency communication)
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

-- ============================================
-- RLS POLICIES (match existing pattern)
-- ============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON contacts FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON team_members FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON portal_messages FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- SEED TEAM MEMBERS (if table is empty)
-- ============================================

INSERT INTO team_members (name, email, role, title, weekly_capacity_hours, hourly_rate, market, is_active)
SELECT * FROM (VALUES
  ('Robert', 'robert@onnify.com', 'owner', 'Founder & CEO', 40, 150, 'SG', true),
  ('Lina', 'lina@onnify.com', 'manager', 'Operations Manager', 40, 80, 'SG', true),
  ('Freelancer', 'freelancer@onnify.com', 'freelancer', 'Contract Specialist', 20, 50, NULL, true)
) AS v(name, email, role, title, weekly_capacity_hours, hourly_rate, market, is_active)
WHERE NOT EXISTS (SELECT 1 FROM team_members LIMIT 1);
