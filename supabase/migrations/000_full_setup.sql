-- ONNIFY-HUB Full Database Setup
-- Run this single file in your Supabase SQL Editor to create all tables and seed data.
-- This combines migrations 001–004 in the correct dependency order.
-- Safe to re-run: uses "IF NOT EXISTS" and "CREATE OR REPLACE" throughout.

-- ============================================================
-- PART 1: INITIAL SCHEMA (from 001_initial_schema.sql)
-- ============================================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  company_name text NOT NULL,
  market text NOT NULL CHECK (market IN ('SG', 'ID', 'US')),
  industry text NOT NULL,
  plan_tier text NOT NULL CHECK (plan_tier IN ('Starter', 'Growth', 'Pro')),
  ghl_url text,
  status text NOT NULL DEFAULT 'Prospect' CHECK (status IN ('Prospect', 'Onboarding', 'Active', 'Churned')),
  primary_contact text NOT NULL,
  contract_start date,
  contract_end date,
  monthly_value numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  name text NOT NULL,
  description text,
  assigned_to text NOT NULL,
  priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Review', 'Delivered', 'Approved')),
  due_date date NOT NULL,
  delivery_date date,
  file_link text,
  client_approved boolean DEFAULT false,
  market text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  month text NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('SGD', 'USD', 'IDR')),
  services_billed text NOT NULL,
  invoice_file_link text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  payment_date date,
  market text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text UNIQUE NOT NULL,
  name text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE SET NULL,
  assigned_to text NOT NULL,
  category text NOT NULL CHECK (category IN ('Admin', 'Strategy', 'Content', 'Tech', 'Sales', 'Ops')),
  status text NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done', 'Blocked')),
  due_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Views
CREATE OR REPLACE VIEW deliverables_with_client AS
  SELECT d.*, c.company_name AS client_name
  FROM deliverables d
  LEFT JOIN clients c ON d.client_id = c.id;

CREATE OR REPLACE VIEW invoices_with_client AS
  SELECT i.*, c.company_name AS client_name
  FROM invoices i
  LEFT JOIN clients c ON i.client_id = c.id;

CREATE OR REPLACE VIEW tasks_with_relations AS
  SELECT t.*, c.company_name AS client_name, del.name AS deliverable_name
  FROM tasks t
  LEFT JOIN clients c ON t.client_id = c.id
  LEFT JOIN deliverables del ON t.deliverable_id = del.id;

-- Auto-update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Timestamp triggers (drop first to avoid "already exists" errors)
DROP TRIGGER IF EXISTS clients_updated_at ON clients;
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS deliverables_updated_at ON deliverables;
CREATE TRIGGER deliverables_updated_at BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate display IDs
CREATE OR REPLACE FUNCTION generate_client_id(p_market text)
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(client_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM clients
  WHERE market = p_market;
  RETURN 'OW-' || p_market || '-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_deliverable_id()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(deliverable_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM deliverables;
  RETURN 'DEL-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_id()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(invoice_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM invoices
  WHERE invoice_id LIKE 'INV-' || extract(year from now())::text || '%';
  RETURN 'INV-' || extract(year from now())::text || '-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_task_id()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(task_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM tasks;
  RETURN 'TSK-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PART 2: SEED DATA (from 002_seed_data.sql)
-- ============================================================

-- Clients (upsert to avoid duplicates on re-run)
INSERT INTO clients (id, client_id, company_name, market, industry, plan_tier, status, primary_contact, contract_start, contract_end, monthly_value) VALUES
  ('11111111-1111-1111-1111-111111111111', 'OW-SG-001', 'PropNex Realty', 'SG', 'Real Estate', 'Pro', 'Active', 'James Tan', '2025-06-01', '2026-05-31', 997),
  ('22222222-2222-2222-2222-222222222222', 'OW-SG-002', 'LiHO Tea', 'SG', 'F&B', 'Growth', 'Active', 'Sarah Lim', '2025-09-01', '2026-08-31', 497),
  ('33333333-3333-3333-3333-333333333333', 'OW-ID-001', 'Tokopedia Seller Hub', 'ID', 'Tech', 'Pro', 'Onboarding', 'Budi Santoso', '2026-01-15', null, 997),
  ('44444444-4444-4444-4444-444444444444', 'OW-US-001', 'Austin Dental Co', 'US', 'Health', 'Starter', 'Active', 'Mike Roberts', '2025-11-01', '2026-10-31', 150),
  ('55555555-5555-5555-5555-555555555555', 'OW-SG-003', 'InsureFirst Asia', 'SG', 'Insurance', 'Growth', 'Prospect', 'Wei Lin', null, null, 497),
  ('66666666-6666-6666-6666-666666666666', 'OW-US-002', 'CloudStack SaaS', 'US', 'SaaS', 'Pro', 'Active', 'Diana Chen', '2025-08-01', '2026-07-31', 997)
ON CONFLICT (id) DO NOTHING;

-- Deliverables
INSERT INTO deliverables (deliverable_id, client_id, service_type, name, description, assigned_to, priority, status, due_date, delivery_date, market, client_approved) VALUES
  ('DEL-001', '11111111-1111-1111-1111-111111111111', 'SEO', 'Q1 SEO Audit Report', 'Full site audit with recommendations', 'Robert', 'High', 'In Progress', '2026-02-25', null, 'SG', false),
  ('DEL-002', '11111111-1111-1111-1111-111111111111', 'Content', 'Blog Series — Property Trends', '4 blog posts on 2026 property trends', 'Lina', 'Medium', 'Review', '2026-02-28', null, 'SG', false),
  ('DEL-003', '22222222-2222-2222-2222-222222222222', 'Paid Media', 'Feb Facebook Ads Campaign', 'CNY promo campaign setup', 'Robert', 'High', 'Delivered', '2026-02-15', '2026-02-14', 'SG', true),
  ('DEL-004', '33333333-3333-3333-3333-333333333333', 'CRM', 'GHL CRM Setup', 'Full GoHighLevel CRM onboarding', 'Robert', 'High', 'Not Started', '2026-03-01', null, 'ID', false),
  ('DEL-005', '44444444-4444-4444-4444-444444444444', 'Voice AI', 'Voice AI Receptionist', 'Configure AI phone answering', 'Freelancer', 'Medium', 'In Progress', '2026-02-22', null, 'US', false),
  ('DEL-006', '66666666-6666-6666-6666-666666666666', 'Strategy', 'Growth Strategy Deck', 'Q1 growth playbook presentation', 'Robert', 'High', 'Not Started', '2026-02-18', null, 'US', false)
ON CONFLICT (deliverable_id) DO NOTHING;

-- Invoices
INSERT INTO invoices (invoice_id, client_id, month, amount, currency, services_billed, status, payment_date, market) VALUES
  ('INV-2026-001', '11111111-1111-1111-1111-111111111111', '2026-02', 997, 'SGD', 'SEO + Content', 'Sent', null, 'SG'),
  ('INV-2026-002', '22222222-2222-2222-2222-222222222222', '2026-02', 497, 'SGD', 'Paid Media', 'Paid', '2026-02-10', 'SG'),
  ('INV-2026-003', '44444444-4444-4444-4444-444444444444', '2026-02', 150, 'USD', 'Voice AI', 'Draft', null, 'US'),
  ('INV-2026-004', '66666666-6666-6666-6666-666666666666', '2026-01', 997, 'USD', 'Strategy + SEO', 'Overdue', null, 'US'),
  ('INV-2026-005', '33333333-3333-3333-3333-333333333333', '2026-02', 14900000, 'IDR', 'CRM Setup', 'Draft', null, 'ID')
ON CONFLICT (invoice_id) DO NOTHING;

-- Tasks
INSERT INTO tasks (task_id, name, client_id, deliverable_id, assigned_to, category, status, due_date, notes) VALUES
  ('TSK-001', 'Prepare weekly client update', '11111111-1111-1111-1111-111111111111', null, 'Robert', 'Admin', 'To Do', '2026-02-21', 'Summary for all SG clients'),
  ('TSK-002', 'Write blog draft #3', '11111111-1111-1111-1111-111111111111', (SELECT id FROM deliverables WHERE deliverable_id = 'DEL-002'), 'Lina', 'Content', 'In Progress', '2026-02-22', 'Topic: HDB resale market'),
  ('TSK-003', 'Setup GHL automations', '33333333-3333-3333-3333-333333333333', null, 'Robert', 'Tech', 'To Do', '2026-02-25', 'Lead capture + nurture workflow'),
  ('TSK-004', 'Invoice follow-up CloudStack', '66666666-6666-6666-6666-666666666666', null, 'Robert', 'Sales', 'Blocked', '2026-02-19', 'Jan invoice overdue — send reminder'),
  ('TSK-005', 'Design social templates', null, null, 'Lina', 'Content', 'Done', '2026-02-18', 'Instagram + LinkedIn templates done'),
  ('TSK-006', 'Review Voice AI scripts', '44444444-4444-4444-4444-444444444444', null, 'Freelancer', 'Ops', 'In Progress', '2026-02-23', 'Check greeting and FAQ flows')
ON CONFLICT (task_id) DO NOTHING;


-- ============================================================
-- PART 3: AUTH & NEW MODULES (from 003_auth_and_new_modules.sql)
-- ============================================================

-- User profiles (references Supabase Auth — only works if auth.users exists)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
    avatar_url text,
    market text CHECK (market IN ('SG', 'ID', 'US')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION WHEN others THEN
  RAISE NOTICE 'user_profiles table already exists or auth.users not available, skipping';
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Content Pipeline
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

DROP TRIGGER IF EXISTS content_items_updated_at ON content_items;
CREATE TRIGGER content_items_updated_at BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_content_id()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(content_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM content_items;
  RETURN 'CNT-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW content_with_client AS
  SELECT ci.*, c.company_name AS client_name
  FROM content_items ci
  LEFT JOIN clients c ON ci.client_id = c.id;

-- GHL Pipeline Sync
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

DROP TRIGGER IF EXISTS ghl_connections_updated_at ON ghl_connections;
CREATE TRIGGER ghl_connections_updated_at BEFORE UPDATE ON ghl_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

CREATE OR REPLACE VIEW ghl_connections_with_client AS
  SELECT g.*, c.company_name AS client_name, c.client_id AS display_client_id, c.market
  FROM ghl_connections g
  LEFT JOIN clients c ON g.client_id = c.id;

-- Notification Rules & Logs
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

DROP TRIGGER IF EXISTS notification_rules_updated_at ON notification_rules;
CREATE TRIGGER notification_rules_updated_at BEFORE UPDATE ON notification_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

-- Client Portal Tokens
CREATE TABLE IF NOT EXISTS portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  access_token text UNIQUE NOT NULL,
  contact_email text NOT NULL,
  contact_name text NOT NULL,
  is_active boolean DEFAULT true,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Seed Notification Rules
INSERT INTO notification_rules (name, trigger_type, channel, recipients, is_active)
SELECT * FROM (VALUES
  ('Overdue Deliverables Alert', 'overdue_deliverable', 'both', ARRAY['Robert', 'Lina'], true),
  ('Overdue Invoice Reminder', 'overdue_invoice', 'email', ARRAY['Robert'], true),
  ('Upcoming Due Dates (3 days)', 'upcoming_due', 'in_app', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('New Task Assignment', 'new_assignment', 'both', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('Client Onboarding Started', 'client_onboarding', 'email', ARRAY['Robert'], true)
) AS v(name, trigger_type, channel, recipients, is_active)
WHERE NOT EXISTS (SELECT 1 FROM notification_rules LIMIT 1);

-- Seed Content Pipeline
INSERT INTO content_items (content_id, client_id, title, content_type, platform, status, assigned_to, due_date, market, notes) VALUES
  ('CNT-001', '11111111-1111-1111-1111-111111111111', '2026 Property Trends Blog #1', 'Blog', 'Website', 'Published', 'Lina', '2026-02-10', 'SG', 'Published on PropNex blog'),
  ('CNT-002', '11111111-1111-1111-1111-111111111111', 'HDB Resale Market Analysis', 'Blog', 'Website', 'Draft', 'Lina', '2026-02-25', 'SG', 'Part of blog series'),
  ('CNT-003', '22222222-2222-2222-2222-222222222222', 'CNY Promo Instagram Set', 'Social Post', 'Instagram', 'Approved', 'Lina', '2026-02-12', 'SG', '5 carousel posts'),
  ('CNT-004', '66666666-6666-6666-6666-666666666666', 'Q1 Growth Playbook Video', 'Video', 'YouTube', 'Ideation', 'Robert', '2026-03-15', 'US', 'Companion to strategy deck'),
  ('CNT-005', '44444444-4444-4444-4444-444444444444', 'Patient Welcome Email Sequence', 'Email Campaign', 'Email', 'Review', 'Freelancer', '2026-02-28', 'US', '3-email onboarding series'),
  ('CNT-006', '33333333-3333-3333-3333-333333333333', 'Tokopedia Seller Tips Newsletter', 'Newsletter', 'Email', 'Ideation', 'Lina', '2026-03-01', 'ID', 'Monthly newsletter launch')
ON CONFLICT (content_id) DO NOTHING;


-- ============================================================
-- PART 4: CONTENT COMMAND CENTER (from 004_content_command_center.sql)
-- ============================================================

-- Alter clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_language text DEFAULT 'English';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_language text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'none';
-- Add check constraint only if it doesn't exist
DO $$
BEGIN
  ALTER TABLE clients ADD CONSTRAINT clients_onboarding_status_check
    CHECK (onboarding_status IN ('none','in_progress','complete'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_voice_summary text;

-- Alter content_items table
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS sla_deadline date;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS current_version integer DEFAULT 1;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'none';
DO $$
BEGIN
  ALTER TABLE content_items ADD CONSTRAINT content_items_review_status_check
    CHECK (review_status IN ('none','internal_review','client_review','changes_requested','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';

-- Client Onboarding
CREATE TABLE IF NOT EXISTS client_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'intake_pending'
    CHECK (status IN ('intake_pending','intake_completed','brand_review','first_content','client_review','complete')),
  intake_data jsonb DEFAULT '{}',
  brand_voice_doc text,
  onboarding_started_at timestamptz DEFAULT now(),
  onboarding_completed_at timestamptz,
  checklist jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS client_onboarding_updated_at ON client_onboarding;
CREATE TRIGGER client_onboarding_updated_at BEFORE UPDATE ON client_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Content Reviews / Approval Workflow
CREATE TABLE IF NOT EXISTS content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('internal','client')),
  reviewer_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve','request_changes','reject')),
  comments text,
  created_at timestamptz DEFAULT now()
);

-- SLA Definitions
CREATE TABLE IF NOT EXISTS sla_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL UNIQUE,
  brief_to_draft_days integer NOT NULL,
  draft_to_review_days integer NOT NULL,
  review_to_publish_days integer NOT NULL,
  total_days integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS sla_definitions_updated_at ON sla_definitions;
CREATE TRIGGER sla_definitions_updated_at BEFORE UPDATE ON sla_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Retainer Tier Definitions
CREATE TABLE IF NOT EXISTS retainer_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  blogs_per_month integer DEFAULT 0,
  service_pages_per_month integer DEFAULT 0,
  pseo_pages_per_month integer DEFAULT 0,
  social_cascades_per_month integer DEFAULT 0,
  email_sequences_per_month integer DEFAULT 0,
  case_studies_per_month integer DEFAULT 0,
  revisions_per_piece integer DEFAULT 1,
  content_requests_per_month integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS retainer_tiers_updated_at ON retainer_tiers;
CREATE TRIGGER retainer_tiers_updated_at BEFORE UPDATE ON retainer_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Retainer Usage Tracking
CREATE TABLE IF NOT EXISTS retainer_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  month text NOT NULL,
  blogs_used integer DEFAULT 0,
  service_pages_used integer DEFAULT 0,
  pseo_pages_used integer DEFAULT 0,
  social_cascades_used integer DEFAULT 0,
  email_sequences_used integer DEFAULT 0,
  case_studies_used integer DEFAULT 0,
  revisions_used integer DEFAULT 0,
  content_requests_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, month)
);

DROP TRIGGER IF EXISTS retainer_usage_updated_at ON retainer_usage;
CREATE TRIGGER retainer_usage_updated_at BEFORE UPDATE ON retainer_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Content Versions
CREATE TABLE IF NOT EXISTS content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  title text NOT NULL,
  content_body text,
  author text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, version_number)
);

-- Quality Scores
CREATE TABLE IF NOT EXISTS quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_items(id) ON DELETE CASCADE UNIQUE,
  seo_score integer DEFAULT 0 CHECK (seo_score >= 0 AND seo_score <= 100),
  brand_voice_score integer DEFAULT 0 CHECK (brand_voice_score >= 0 AND brand_voice_score <= 100),
  uniqueness_score integer DEFAULT 0 CHECK (uniqueness_score >= 0 AND uniqueness_score <= 100),
  humanness_score integer DEFAULT 0 CHECK (humanness_score >= 0 AND humanness_score <= 100),
  completeness_score integer DEFAULT 0 CHECK (completeness_score >= 0 AND completeness_score <= 100),
  composite_score numeric DEFAULT 0,
  scored_by text,
  scored_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS quality_scores_updated_at ON quality_scores;
CREATE TRIGGER quality_scores_updated_at BEFORE UPDATE ON quality_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Content Requests
CREATE TABLE IF NOT EXISTS content_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  portal_access_id uuid REFERENCES portal_access(id) ON DELETE SET NULL,
  content_type text NOT NULL,
  topic text NOT NULL,
  target_keyword text,
  priority text DEFAULT 'standard' CHECK (priority IN ('standard','urgent','rush')),
  desired_date date,
  reference_urls text,
  reference_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','converted')),
  converted_content_id uuid REFERENCES content_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS content_requests_updated_at ON content_requests;
CREATE TRIGGER content_requests_updated_at BEFORE UPDATE ON content_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_request_id()
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT coalesce(max(
    cast(substring(request_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM content_requests;
  RETURN 'REQ-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Client Reports
CREATE TABLE IF NOT EXISTS client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  month text NOT NULL,
  summary text,
  content_delivered jsonb DEFAULT '[]',
  pipeline_status jsonb DEFAULT '{}',
  performance_data jsonb DEFAULT '{}',
  recommendations text,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS client_reports_updated_at ON client_reports;
CREATE TRIGGER client_reports_updated_at BEFORE UPDATE ON client_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION generate_report_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  current_month text;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  SELECT coalesce(max(
    cast(substring(report_id from '[0-9]+$') as integer)
  ), 0) + 1
  INTO next_num
  FROM client_reports;
  RETURN 'RPT-' || current_month || '-' || lpad(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Content Performance
CREATE TABLE IF NOT EXISTS content_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_items(id) ON DELETE CASCADE UNIQUE,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  avg_position numeric,
  performance_tier text CHECK (performance_tier IN ('high','mid','low')),
  last_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS content_performance_updated_at ON content_performance;
CREATE TRIGGER content_performance_updated_at BEFORE UPDATE ON content_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Updated Views
CREATE OR REPLACE VIEW content_with_client AS
  SELECT ci.*, c.company_name AS client_name
  FROM content_items ci
  LEFT JOIN clients c ON ci.client_id = c.id;

CREATE OR REPLACE VIEW content_requests_with_client AS
  SELECT cr.*, c.company_name AS client_name
  FROM content_requests cr
  LEFT JOIN clients c ON cr.client_id = c.id;

CREATE OR REPLACE VIEW client_reports_with_client AS
  SELECT r.*, c.company_name AS client_name
  FROM client_reports r
  LEFT JOIN clients c ON r.client_id = c.id;

CREATE OR REPLACE VIEW content_with_quality AS
  SELECT ci.*, c.company_name AS client_name,
    qs.seo_score, qs.brand_voice_score, qs.uniqueness_score,
    qs.humanness_score, qs.completeness_score, qs.composite_score
  FROM content_items ci
  LEFT JOIN clients c ON ci.client_id = c.id
  LEFT JOIN quality_scores qs ON qs.content_id = ci.id;

CREATE OR REPLACE VIEW content_with_performance AS
  SELECT ci.*, c.company_name AS client_name,
    cp.impressions, cp.clicks, cp.avg_position, cp.performance_tier
  FROM content_items ci
  LEFT JOIN clients c ON ci.client_id = c.id
  LEFT JOIN content_performance cp ON cp.content_id = ci.id;

-- Seed SLA Definitions
INSERT INTO sla_definitions (content_type, brief_to_draft_days, draft_to_review_days, review_to_publish_days, total_days) VALUES
  ('Blog', 2, 1, 2, 5),
  ('Social Post', 1, 1, 1, 3),
  ('Email Campaign', 2, 1, 2, 5),
  ('Video', 3, 2, 2, 7),
  ('Case Study', 3, 2, 2, 7),
  ('Newsletter', 2, 1, 1, 4)
ON CONFLICT (content_type) DO NOTHING;

-- Seed Retainer Tier Definitions
INSERT INTO retainer_tiers (name, blogs_per_month, service_pages_per_month, pseo_pages_per_month, social_cascades_per_month, email_sequences_per_month, case_studies_per_month, revisions_per_piece, content_requests_per_month) VALUES
  ('Starter', 4, 2, 0, 2, 0, 0, 1, 2),
  ('Growth', 8, 4, 20, 8, 1, 1, 2, 5),
  ('Pro', 16, 8, 100, 16, 4, 2, 3, 999)
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- DONE: All tables, views, functions, triggers, and seed data created.
-- ============================================================
