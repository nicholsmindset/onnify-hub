-- ONNIFY-HUB Phase 3: Auth, Content Pipeline, GHL Sync, Notifications, Reports, Portal
-- Run this after 002_seed_data.sql

-- ============================================
-- USER PROFILES & ROLES
-- ============================================

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  avatar_url text,
  market text check (market in ('SG', 'ID', 'US')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger user_profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at();

-- ============================================
-- CONTENT PIPELINE
-- ============================================

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  content_id text unique not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  content_type text not null check (content_type in ('Blog', 'Social Post', 'Email Campaign', 'Video', 'Case Study', 'Newsletter')),
  platform text check (platform in ('Website', 'Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'Email', 'TikTok')),
  status text not null default 'Ideation' check (status in ('Ideation', 'Draft', 'Review', 'Approved', 'Scheduled', 'Published')),
  assigned_to text not null,
  due_date date not null,
  publish_date date,
  content_body text,
  file_link text,
  notes text,
  market text not null check (market in ('SG', 'ID', 'US')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger content_items_updated_at before update on content_items
  for each row execute function update_updated_at();

create or replace function generate_content_id()
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(content_id from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from content_items;
  return 'CNT-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql;

create or replace view content_with_client as
  select ci.*, c.company_name as client_name
  from content_items ci
  left join clients c on ci.client_id = c.id;

-- ============================================
-- GHL PIPELINE SYNC
-- ============================================

create table if not exists ghl_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade unique,
  api_key text,
  location_id text,
  sync_enabled boolean default false,
  last_sync_at timestamptz,
  sync_status text default 'disconnected' check (sync_status in ('connected', 'disconnected', 'syncing', 'error')),
  contacts_synced integer default 0,
  pipelines_synced integer default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger ghl_connections_updated_at before update on ghl_connections
  for each row execute function update_updated_at();

create table if not exists ghl_sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references ghl_connections(id) on delete cascade,
  sync_type text not null check (sync_type in ('contacts', 'pipelines', 'opportunities', 'full')),
  status text not null check (status in ('started', 'completed', 'failed')),
  records_processed integer default 0,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create or replace view ghl_connections_with_client as
  select g.*, c.company_name as client_name, c.client_id as display_client_id, c.market
  from ghl_connections g
  left join clients c on g.client_id = c.id;

-- ============================================
-- NOTIFICATION RULES & LOGS
-- ============================================

create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null check (trigger_type in ('overdue_deliverable', 'overdue_invoice', 'status_change', 'upcoming_due', 'new_assignment', 'client_onboarding')),
  channel text not null default 'email' check (channel in ('email', 'in_app', 'both')),
  recipients text[] not null default '{}',
  is_active boolean default true,
  conditions jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger notification_rules_updated_at before update on notification_rules
  for each row execute function update_updated_at();

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  title text not null,
  message text not null,
  type text not null check (type in ('info', 'warning', 'error', 'success')),
  is_read boolean default false,
  link text,
  created_at timestamptz default now()
);

-- ============================================
-- CLIENT PORTAL TOKENS
-- ============================================

create table if not exists portal_access (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade unique,
  access_token text unique not null,
  contact_email text not null,
  contact_name text not null,
  is_active boolean default true,
  last_accessed_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- SEED NOTIFICATION RULES
-- ============================================

insert into notification_rules (name, trigger_type, channel, recipients, is_active) values
  ('Overdue Deliverables Alert', 'overdue_deliverable', 'both', ARRAY['Robert', 'Lina'], true),
  ('Overdue Invoice Reminder', 'overdue_invoice', 'email', ARRAY['Robert'], true),
  ('Upcoming Due Dates (3 days)', 'upcoming_due', 'in_app', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('New Task Assignment', 'new_assignment', 'both', ARRAY['Robert', 'Lina', 'Freelancer'], true),
  ('Client Onboarding Started', 'client_onboarding', 'email', ARRAY['Robert'], true);

-- ============================================
-- SEED CONTENT PIPELINE
-- ============================================

insert into content_items (content_id, client_id, title, content_type, platform, status, assigned_to, due_date, market, notes) values
  ('CNT-001', '11111111-1111-1111-1111-111111111111', '2026 Property Trends Blog #1', 'Blog', 'Website', 'Published', 'Lina', '2026-02-10', 'SG', 'Published on PropNex blog'),
  ('CNT-002', '11111111-1111-1111-1111-111111111111', 'HDB Resale Market Analysis', 'Blog', 'Website', 'Draft', 'Lina', '2026-02-25', 'SG', 'Part of blog series'),
  ('CNT-003', '22222222-2222-2222-2222-222222222222', 'CNY Promo Instagram Set', 'Social Post', 'Instagram', 'Approved', 'Lina', '2026-02-12', 'SG', '5 carousel posts'),
  ('CNT-004', '66666666-6666-6666-6666-666666666666', 'Q1 Growth Playbook Video', 'Video', 'YouTube', 'Ideation', 'Robert', '2026-03-15', 'US', 'Companion to strategy deck'),
  ('CNT-005', '44444444-4444-4444-4444-444444444444', 'Patient Welcome Email Sequence', 'Email Campaign', 'Email', 'Review', 'Freelancer', '2026-02-28', 'US', '3-email onboarding series'),
  ('CNT-006', '33333333-3333-3333-3333-333333333333', 'Tokopedia Seller Tips Newsletter', 'Newsletter', 'Email', 'Ideation', 'Lina', '2026-03-01', 'ID', 'Monthly newsletter launch');
