-- ONNIFY-HUB Initial Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================
-- TABLES
-- ============================================

-- Clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_id text unique not null,
  company_name text not null,
  market text not null check (market in ('SG', 'ID', 'US')),
  industry text not null,
  plan_tier text not null check (plan_tier in ('Starter', 'Growth', 'Pro')),
  ghl_url text,
  status text not null default 'Prospect' check (status in ('Prospect', 'Onboarding', 'Active', 'Churned')),
  primary_contact text not null,
  contract_start date,
  contract_end date,
  monthly_value numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Deliverables table
create table if not exists deliverables (
  id uuid primary key default gen_random_uuid(),
  deliverable_id text unique not null,
  client_id uuid references clients(id) on delete cascade,
  service_type text not null,
  name text not null,
  description text,
  assigned_to text not null,
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Review', 'Delivered', 'Approved')),
  due_date date not null,
  delivery_date date,
  file_link text,
  client_approved boolean default false,
  market text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_id text unique not null,
  client_id uuid references clients(id) on delete cascade,
  month text not null,
  amount numeric(15,2) not null,
  currency text not null check (currency in ('SGD', 'USD', 'IDR')),
  services_billed text not null,
  invoice_file_link text,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Paid', 'Overdue')),
  payment_date date,
  market text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks table
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  task_id text unique not null,
  name text not null,
  client_id uuid references clients(id) on delete set null,
  deliverable_id uuid references deliverables(id) on delete set null,
  assigned_to text not null,
  category text not null check (category in ('Admin', 'Strategy', 'Content', 'Tech', 'Sales', 'Ops')),
  status text not null default 'To Do' check (status in ('To Do', 'In Progress', 'Done', 'Blocked')),
  due_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- VIEWS (denormalized reads)
-- ============================================

create or replace view deliverables_with_client as
  select d.*, c.company_name as client_name
  from deliverables d
  left join clients c on d.client_id = c.id;

create or replace view invoices_with_client as
  select i.*, c.company_name as client_name
  from invoices i
  left join clients c on i.client_id = c.id;

create or replace view tasks_with_relations as
  select t.*, c.company_name as client_name, del.name as deliverable_name
  from tasks t
  left join clients c on t.client_id = c.id
  left join deliverables del on t.deliverable_id = del.id;

-- ============================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger deliverables_updated_at before update on deliverables
  for each row execute function update_updated_at();

create trigger invoices_updated_at before update on invoices
  for each row execute function update_updated_at();

create trigger tasks_updated_at before update on tasks
  for each row execute function update_updated_at();

-- ============================================
-- AUTO-GENERATE DISPLAY IDS
-- ============================================

create or replace function generate_client_id(p_market text)
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(client_id from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from clients
  where market = p_market;
  return 'OW-' || p_market || '-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql;

create or replace function generate_deliverable_id()
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(deliverable_id from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from deliverables;
  return 'DEL-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql;

create or replace function generate_invoice_id()
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(invoice_id from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from invoices
  where invoice_id like 'INV-' || extract(year from now())::text || '%';
  return 'INV-' || extract(year from now())::text || '-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql;

create or replace function generate_task_id()
returns text as $$
declare
  next_num integer;
begin
  select coalesce(max(
    cast(substring(task_id from '[0-9]+$') as integer)
  ), 0) + 1
  into next_num
  from tasks;
  return 'TSK-' || lpad(next_num::text, 3, '0');
end;
$$ language plpgsql;
