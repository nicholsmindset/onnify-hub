-- ONNIFY-HUB Phase 4: Content Command Center
-- 10 Strategic Upgrades: Onboarding, Portal Approval, SLA, Retainer, Versions, Quality, Requests, Reports, Performance, Multi-Language
-- Run this after 003_auth_and_new_modules.sql

-- ============================================
-- ALTER EXISTING TABLES
-- ============================================

-- Clients: add language + onboarding fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_language text DEFAULT 'English';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS secondary_language text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'none'
  CHECK (onboarding_status IN ('none','in_progress','complete'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_voice_summary text;

-- Content items: add SLA, versioning, review, language fields
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS sla_deadline date;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS current_version integer DEFAULT 1;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'none'
  CHECK (review_status IN ('none','internal_review','client_review','changes_requested','approved','rejected'));
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS language text DEFAULT 'English';

-- ============================================
-- UPGRADE 1: CLIENT ONBOARDING
-- ============================================

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

CREATE TRIGGER client_onboarding_updated_at BEFORE UPDATE ON client_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- UPGRADE 2: CONTENT REVIEWS / APPROVAL WORKFLOW
-- ============================================

CREATE TABLE IF NOT EXISTS content_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content_items(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('internal','client')),
  reviewer_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve','request_changes','reject')),
  comments text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- UPGRADE 3: SLA DEFINITIONS
-- ============================================

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

CREATE TRIGGER sla_definitions_updated_at BEFORE UPDATE ON sla_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- UPGRADE 4: RETAINER TIER DEFINITIONS
-- ============================================

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

CREATE TRIGGER retainer_tiers_updated_at BEFORE UPDATE ON retainer_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RETAINER USAGE TRACKING
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

CREATE TRIGGER retainer_usage_updated_at BEFORE UPDATE ON retainer_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- UPGRADE 5: CONTENT VERSIONS
-- ============================================

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

-- ============================================
-- UPGRADE 6: QUALITY SCORES
-- ============================================

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

CREATE TRIGGER quality_scores_updated_at BEFORE UPDATE ON quality_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- UPGRADE 7: CONTENT REQUESTS
-- ============================================

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

-- ============================================
-- UPGRADE 8: CLIENT REPORTS
-- ============================================

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

-- ============================================
-- UPGRADE 9: CONTENT PERFORMANCE
-- ============================================

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

CREATE TRIGGER content_performance_updated_at BEFORE UPDATE ON content_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- Update content_with_client to include new columns
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

-- ============================================
-- SEED: SLA DEFINITIONS
-- ============================================

INSERT INTO sla_definitions (content_type, brief_to_draft_days, draft_to_review_days, review_to_publish_days, total_days) VALUES
  ('Blog', 2, 1, 2, 5),
  ('Social Post', 1, 1, 1, 3),
  ('Email Campaign', 2, 1, 2, 5),
  ('Video', 3, 2, 2, 7),
  ('Case Study', 3, 2, 2, 7),
  ('Newsletter', 2, 1, 1, 4);

-- ============================================
-- SEED: RETAINER TIER DEFINITIONS
-- ============================================

INSERT INTO retainer_tiers (name, blogs_per_month, service_pages_per_month, pseo_pages_per_month, social_cascades_per_month, email_sequences_per_month, case_studies_per_month, revisions_per_piece, content_requests_per_month) VALUES
  ('Starter', 4, 2, 0, 2, 0, 0, 1, 2),
  ('Growth', 8, 4, 20, 8, 1, 1, 2, 5),
  ('Pro', 16, 8, 100, 16, 4, 2, 3, 999);
