import { createClient } from "@supabase/supabase-js";

// Server-only — never import this in client components.
// Uses the service role key which bypasses RLS.
export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
