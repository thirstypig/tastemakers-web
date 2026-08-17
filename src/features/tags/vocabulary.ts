/**
 * Tag vocabulary rules, ported from the iOS app.
 *
 * The app offers a curated pool the user can pick from, plus free-form tag
 * creation capped at 17 characters. Keeping both halves in one place means
 * the web enforces exactly what iOS enforces.
 */

/** "Popular tags (choose any)" — the curated pool, in the app's own order. */
export const POPULAR_TAG_POOL = [
  "Good Variety",
  "Not so Cheap $$",
  "Great Service",
  "Bad Service",
  "Bad Decor",
  "No Reservations",
  "Short Wait",
  "Long Wait",
  "Cheap $",
  "Pricey $$$",
  "Walk Ins",
  "Authentic",
  "Non-Authentic",
  "Fast Service",
] as const;

/** "Create New Tags (17 characters limit)" — the cap is shown in the UI. */
export const TAG_MAX_LENGTH = 17;

/**
 * Collapse a tag to a comparison key: case-insensitive, and insensitive to
 * leading/trailing/repeated whitespace. "  Great   Service " and
 * "great service" are the same tag.
 */
export function normalizeTag(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

export type TagValidation =
  | { ok: true; kind: "existing"; tag: string }
  | { ok: true; kind: "new"; tag: string }
  | { ok: false; reason: "empty" | "too-long" };

/**
 * Validate a free-form tag against the tags already in play.
 *
 * Returns `kind: "existing"` when the input resolves to a tag that already
 * exists — the caller should reuse that tag rather than creating a duplicate,
 * because a reused tag is a vote and a near-duplicate is a fragmented one.
 */
export function validateNewTag(input: string, existing: readonly string[]): TagValidation {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (trimmed.length === 0) return { ok: false, reason: "empty" };
  if (trimmed.length > TAG_MAX_LENGTH) return { ok: false, reason: "too-long" };

  const match = findExistingTag(trimmed, existing);
  if (match) return { ok: true, kind: "existing", tag: match };

  return { ok: true, kind: "new", tag: trimmed };
}

/**
 * Find the tag in `existing` that `input` should collapse into, or null to
 * create a new one.
 *
 * TODO(james): decide how aggressive this should be — see the note in chat.
 * Exact normalized match is implemented; the near-duplicate policy is yours.
 */
export function findExistingTag(input: string, existing: readonly string[]): string | null {
  const key = normalizeTag(input);
  return existing.find((t) => normalizeTag(t) === key) ?? null;
}
