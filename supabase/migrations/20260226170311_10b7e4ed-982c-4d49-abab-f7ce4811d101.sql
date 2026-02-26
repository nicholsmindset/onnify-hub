
CREATE TABLE public.portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  access_token TEXT NOT NULL UNIQUE,
  contact_email TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.portal_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to portal_access"
  ON public.portal_access FOR ALL
  USING (true)
  WITH CHECK (true);
