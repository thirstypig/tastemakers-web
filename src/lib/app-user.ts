/**
 * Resolve the acting user's row id in `public.users`.
 *
 * The API routes used to read this straight off the Supabase session:
 *
 *     const appUserId = user.user_metadata?.app_user_id as number | undefined;
 *
 * `user_metadata` is writable by the user it describes — a signed-in visitor can
 * call `supabase.auth.updateUser({ data: { app_user_id: 42 } })` with their own
 * anon session and it sticks. It is a claim, not an identity, and it was deciding
 * who a tag write or DELETE belonged to.
 *
 * The email on a verified session is the one thing the holder cannot rewrite, so
 * the id is looked up from that instead. `user_metadata` is deliberately not a
 * parameter here: there is nothing in it worth consulting, and accepting it would
 * invite it back in as a fallback.
 *
 * The lookup is injected rather than imported so this stays pure and testable —
 * the callers pass a service-role query.
 */
export async function resolveAppUserId(
  // Deliberately a wide shape: a real Supabase user carries user_metadata and
  // much else. Accepting it while reading ONLY `email` is the point — the
  // extra fields exist and are ignored, rather than being unrepresentable.
  user: { email?: string | null; [key: string]: unknown },
  lookupByEmail: (email: string) => Promise<number | null>,
): Promise<number | null> {
  const email = user.email?.trim();
  if (!email) return null;

  return await lookupByEmail(email);
}
