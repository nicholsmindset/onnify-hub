import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vjezrfpnknkfehcwrlfq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZXpyZnBua25rZmVoY3dybGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMDkzMDEsImV4cCI6MjA4NzY4NTMwMX0.eDUCtxlUGbMjz1PBczjXkHQmUAUsFcF2E_AXFQgn9tY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
