import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Untyped client — avoids strict type issues until schema types are regenerated
export const supabase = createClient(supabaseUrl, supabaseKey);
