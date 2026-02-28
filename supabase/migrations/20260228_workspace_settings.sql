-- Workspace settings table for white-label/branding configuration
CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name           text NOT NULL DEFAULT 'Onnify Works',
  logo_url              text,
  accent_color          text DEFAULT '#6366f1',
  default_market        text DEFAULT 'SG',
  portal_title          text DEFAULT 'Your Project Portal',
  portal_welcome_message text,
  portal_accent_color   text,
  hide_powered_by       boolean DEFAULT false,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all workspace_settings"
  ON public.workspace_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.workspace_settings TO anon, authenticated;

-- Seed with one default row if empty
INSERT INTO public.workspace_settings (agency_name, portal_title)
SELECT 'Onnify Works', 'Your Project Portal'
WHERE NOT EXISTS (SELECT 1 FROM public.workspace_settings);
