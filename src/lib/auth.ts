/**
 * Parses a comma-separated ADMIN_EMAILS env string into a normalised list.
 * Each entry is trimmed and lowercased. Empty strings are filtered out.
 */
export function parseAllowedEmails(raw: string): string[] {
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns true when:
 *   - the allowList is empty (open access — Supabase env not restricted), OR
 *   - the email is present and found in the allowList (case-insensitive).
 *
 * Returns false when:
 *   - email is absent/undefined (no authenticated user), OR
 *   - email is not in a non-empty allowList.
 */
export function isEmailAllowed(
  email: string | undefined,
  allowList: string[],
): boolean {
  if (allowList.length === 0) return true;
  if (!email) return false;
  return allowList.includes(email.toLowerCase());
}

/**
 * Returns a safe post-login redirect path from a user-supplied `?next` value.
 *
 * Only same-origin relative paths are honoured. Everything else falls back:
 *   - null / empty                         → fallback
 *   - not starting with "/" ("https://x")  → fallback
 *   - protocol-relative ("//evil.com")     → fallback (would navigate off-site)
 *   - backslash trick ("/\\evil.com")      → fallback
 *
 * Prevents open redirects: `/login?next=//evil.com` must not bounce the user to
 * an external site after authenticating.
 */
export function safeRedirectPath(
  raw: string | null | undefined,
  fallback = "/explore",
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  return raw;
}
