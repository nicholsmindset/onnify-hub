-- Fix security definer views by recreating with security_invoker
DROP VIEW IF EXISTS public.deliverables_with_client;
DROP VIEW IF EXISTS public.invoices_with_client;
DROP VIEW IF EXISTS public.tasks_with_relations;

CREATE VIEW public.deliverables_with_client WITH (security_invoker=on) AS
  SELECT d.*, c.company_name AS client_name FROM public.deliverables d LEFT JOIN public.clients c ON d.client_id = c.id;

CREATE VIEW public.invoices_with_client WITH (security_invoker=on) AS
  SELECT i.*, c.company_name AS client_name FROM public.invoices i LEFT JOIN public.clients c ON i.client_id = c.id;

CREATE VIEW public.tasks_with_relations WITH (security_invoker=on) AS
  SELECT t.*, c.company_name AS client_name, del.name AS deliverable_name
  FROM public.tasks t LEFT JOIN public.clients c ON t.client_id = c.id LEFT JOIN public.deliverables del ON t.deliverable_id = del.id;

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_client_id(p_market text) RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.clients WHERE market = p_market;
  RETURN 'OW-' || p_market || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_deliverable_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(deliverable_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.deliverables;
  RETURN 'DEL-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_invoice_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.invoices WHERE invoice_id LIKE 'INV-' || EXTRACT(YEAR FROM now())::text || '%';
  RETURN 'INV-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_task_id() RETURNS text AS $$
DECLARE next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_id FROM '[0-9]+$') AS integer)), 0) + 1 INTO next_num FROM public.tasks;
  RETURN 'TSK-' || LPAD(next_num::text, 3, '0');
END;
$$ LANGUAGE plpgsql SET search_path = public;