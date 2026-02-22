import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://xjayfjaewnhfoesmwdkh.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqYXlmamFld25oZm9lc213ZGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzM0NDIsImV4cCI6MjA4NzI0OTQ0Mn0.6Mik_jGirWT7ABIr0uoZlB3UV_TAZo7mZv7GBokVyM8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
