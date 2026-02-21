-- ONNIFY-HUB Seed Data
-- Run this after 001_initial_schema.sql to populate with initial data

-- Clients
insert into clients (id, client_id, company_name, market, industry, plan_tier, status, primary_contact, contract_start, contract_end, monthly_value) values
  ('11111111-1111-1111-1111-111111111111', 'OW-SG-001', 'PropNex Realty', 'SG', 'Real Estate', 'Pro', 'Active', 'James Tan', '2025-06-01', '2026-05-31', 997),
  ('22222222-2222-2222-2222-222222222222', 'OW-SG-002', 'LiHO Tea', 'SG', 'F&B', 'Growth', 'Active', 'Sarah Lim', '2025-09-01', '2026-08-31', 497),
  ('33333333-3333-3333-3333-333333333333', 'OW-ID-001', 'Tokopedia Seller Hub', 'ID', 'Tech', 'Pro', 'Onboarding', 'Budi Santoso', '2026-01-15', null, 997),
  ('44444444-4444-4444-4444-444444444444', 'OW-US-001', 'Austin Dental Co', 'US', 'Health', 'Starter', 'Active', 'Mike Roberts', '2025-11-01', '2026-10-31', 150),
  ('55555555-5555-5555-5555-555555555555', 'OW-SG-003', 'InsureFirst Asia', 'SG', 'Insurance', 'Growth', 'Prospect', 'Wei Lin', null, null, 497),
  ('66666666-6666-6666-6666-666666666666', 'OW-US-002', 'CloudStack SaaS', 'US', 'SaaS', 'Pro', 'Active', 'Diana Chen', '2025-08-01', '2026-07-31', 997);

-- Deliverables
insert into deliverables (deliverable_id, client_id, service_type, name, description, assigned_to, priority, status, due_date, delivery_date, market, client_approved) values
  ('DEL-001', '11111111-1111-1111-1111-111111111111', 'SEO', 'Q1 SEO Audit Report', 'Full site audit with recommendations', 'Robert', 'High', 'In Progress', '2026-02-25', null, 'SG', false),
  ('DEL-002', '11111111-1111-1111-1111-111111111111', 'Content', 'Blog Series — Property Trends', '4 blog posts on 2026 property trends', 'Lina', 'Medium', 'Review', '2026-02-28', null, 'SG', false),
  ('DEL-003', '22222222-2222-2222-2222-222222222222', 'Paid Media', 'Feb Facebook Ads Campaign', 'CNY promo campaign setup', 'Robert', 'High', 'Delivered', '2026-02-15', '2026-02-14', 'SG', true),
  ('DEL-004', '33333333-3333-3333-3333-333333333333', 'CRM', 'GHL CRM Setup', 'Full GoHighLevel CRM onboarding', 'Robert', 'High', 'Not Started', '2026-03-01', null, 'ID', false),
  ('DEL-005', '44444444-4444-4444-4444-444444444444', 'Voice AI', 'Voice AI Receptionist', 'Configure AI phone answering', 'Freelancer', 'Medium', 'In Progress', '2026-02-22', null, 'US', false),
  ('DEL-006', '66666666-6666-6666-6666-666666666666', 'Strategy', 'Growth Strategy Deck', 'Q1 growth playbook presentation', 'Robert', 'High', 'Not Started', '2026-02-18', null, 'US', false);

-- Invoices
insert into invoices (invoice_id, client_id, month, amount, currency, services_billed, status, payment_date, market) values
  ('INV-2026-001', '11111111-1111-1111-1111-111111111111', '2026-02', 997, 'SGD', 'SEO + Content', 'Sent', null, 'SG'),
  ('INV-2026-002', '22222222-2222-2222-2222-222222222222', '2026-02', 497, 'SGD', 'Paid Media', 'Paid', '2026-02-10', 'SG'),
  ('INV-2026-003', '44444444-4444-4444-4444-444444444444', '2026-02', 150, 'USD', 'Voice AI', 'Draft', null, 'US'),
  ('INV-2026-004', '66666666-6666-6666-6666-666666666666', '2026-01', 997, 'USD', 'Strategy + SEO', 'Overdue', null, 'US'),
  ('INV-2026-005', '33333333-3333-3333-3333-333333333333', '2026-02', 14900000, 'IDR', 'CRM Setup', 'Draft', null, 'ID');

-- Tasks
insert into tasks (task_id, name, client_id, deliverable_id, assigned_to, category, status, due_date, notes) values
  ('TSK-001', 'Prepare weekly client update', '11111111-1111-1111-1111-111111111111', null, 'Robert', 'Admin', 'To Do', '2026-02-21', 'Summary for all SG clients'),
  ('TSK-002', 'Write blog draft #3', '11111111-1111-1111-1111-111111111111', (select id from deliverables where deliverable_id = 'DEL-002'), 'Lina', 'Content', 'In Progress', '2026-02-22', 'Topic: HDB resale market'),
  ('TSK-003', 'Setup GHL automations', '33333333-3333-3333-3333-333333333333', null, 'Robert', 'Tech', 'To Do', '2026-02-25', 'Lead capture + nurture workflow'),
  ('TSK-004', 'Invoice follow-up CloudStack', '66666666-6666-6666-6666-666666666666', null, 'Robert', 'Sales', 'Blocked', '2026-02-19', 'Jan invoice overdue — send reminder'),
  ('TSK-005', 'Design social templates', null, null, 'Lina', 'Content', 'Done', '2026-02-18', 'Instagram + LinkedIn templates done'),
  ('TSK-006', 'Review Voice AI scripts', '44444444-4444-4444-4444-444444444444', null, 'Freelancer', 'Ops', 'In Progress', '2026-02-23', 'Check greeting and FAQ flows');
