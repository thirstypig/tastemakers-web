import { createClient } from "@supabase/supabase-js";

// Server-only — never import this in client components.
// Uses the service role key which bypasses RLS.
export function createAdminClient() {
  return createClient(
    supabaseUrl()!,
    supabaseServiceRoleKey()!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
import { supabaseUrl, supabaseServiceRoleKey } from "@/lib/supabase/server-env";
