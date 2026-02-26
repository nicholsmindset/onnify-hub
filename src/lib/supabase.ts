// Re-export the auto-generated Supabase client from Lovable Cloud
// Cast to any to allow access to tables not yet in the typed schema
import { supabase as typedSupabase } from "@/integrations/supabase/client";
export const supabase = typedSupabase as any;
