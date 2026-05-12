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
