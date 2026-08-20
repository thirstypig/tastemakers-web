import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/server-env";

export function createServerClient() {
  return createClient(
    supabaseUrl()!,
    supabaseAnonKey()!,
    { auth: { persistSession: false } },
  );
}
