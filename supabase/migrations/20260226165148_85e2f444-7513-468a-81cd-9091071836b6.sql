-- Clients table
CREATE TABLE public.clients (
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
CREATE TABLE public.deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
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
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text UNIQUE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
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
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id text UNIQUE NOT NULL,
  name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  deliverable_id uuid REFERENCES public.deliverables(id) ON DELETE SET NULL,
  assigned_to text NOT NULL,
  category text NOT NULL CHECK (category IN ('Admin', 'Strategy', 'Content', 'Tech', 'Sales', 'Ops')),
  status text NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done', 'Blocked')),
  due_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS (permissive for now — no auth yet)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deliverables" ON public.deliverables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Views
CREATE OR REPLACE VIEW public.deliverables_with_client AS
  SELECT d.*, c.company_name AS client_name FROM public.deliverables d LEFT JOIN public.clients c ON d.client_id = c.id;

CREATE OR REPLACE VIEW public.invoices_with_client AS
  SELECT i.*, c.company_name AS client_name FROM public.invoices i LEFT JOIN public.clients c ON i.client_id = c.id;

CREATE OR REPLACE VIEW public.tasks_with_relations AS
  SELECT t.*, c.company_name AS client_name, del.name AS deliverable_name
  FROM public.tasks t LEFT JOIN public.clients c ON t.client_id = c.id LEFT JOIN public.deliverables del ON t.deliverable_id = del.id;

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER deliverables_updated_at BEFORE UPDATE ON public.deliverables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-generate display IDs
CREATE OR REPLACE FUNCTION public.generate_client_id(p_market text) RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.clients WHERE market = p_market;
  RETURN 'OW-' || p_market || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_deliverable_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(deliverable_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.deliverables;
  RETURN 'DEL-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_invoice_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.invoices WHERE invoice_id LIKE 'INV-' || EXTRACT(YEAR FROM now())::text || '%';
  RETURN 'INV-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_task_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.tasks;
  RETURN 'TSK-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql;