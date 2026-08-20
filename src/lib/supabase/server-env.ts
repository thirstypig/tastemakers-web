/**
 * Canonical Supabase env resolution for SERVER-side code (todo 095).
 *
 * The public data layer (`supabase-server.ts`) read `NEXT_PUBLIC_SUPABASE_*`
 * while middleware, the auth callback, and the tag route handlers read the
 * unprefixed `SUPABASE_*`. If a deploy set only one pair, half the app worked
 * and half broke with no obvious link — the classic "works in dev, half-broken
 * in prod" split. Routing server code through one resolver that accepts either
 * name removes that footgun.
 *
 * Precedence is unprefixed-first: server code should prefer the server-only
 * variable, falling back to the build-time-inlined `NEXT_PUBLIC_` value so a
 * deploy that set only that pair still works. Do NOT import this from client
 * ("use client") code — the browser can only read `NEXT_PUBLIC_` names, so use
 * `src/lib/supabase.ts` there.
 *
 * The admin gate in `src/middleware.ts` deliberately does NOT use this: it
 * requires the strict unprefixed pair and fails closed when unset, which is a
 * security property, not the footgun this fixes. Leave it strict.
 */
export function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseAnonKey(): string | undefined {
  return process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function supabaseServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}
