/**
 * URL slugs for restaurants and lists.
 *
 * Names alone are not unique: of 1,388 restaurants only 1,233 produce distinct
 * name slugs, 68 slugs are claimed by more than one row (14 In-N-Out Burgers,
 * 11 Din Tai Fungs), and 34 names are non-Latin and slugify to nothing.
 *
 * So the id goes on the end — `langers-delicatessen-159`. Readable and
 * keyword-bearing for search, guaranteed unique, and stable if a restaurant is
 * renamed. Because the id is a trailing segment it can be parsed straight back
 * out, which lets the old numeric URLs 301 to the canonical one.
 */

/** Lowercase, strip accents, collapse everything else to single hyphens. */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // Drop combining marks so "Café" → "Cafe" rather than "Caf".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    // Keep URLs a sane length; the id still guarantees uniqueness.
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/**
 * Canonical slug for a record. Falls back to the bare id when the name
 * slugifies to nothing, so non-Latin names still get a working URL.
 */
export function buildSlug(name: string | null | undefined, id: string | number): string {
  const base = slugify(name ?? "");
  return base ? `${base}-${id}` : String(id);
}

/**
 * Pull the id back out of a slug.
 *
 * Accepts the canonical form (`langers-159`), a bare id (`159` — the URLs
 * that shipped before slugs existed), and a stale name with the right id
 * (`old-name-159`, after a rename). Returns null when there is no trailing id.
 */
export function parseIdFromSlug(slug: string): string | null {
  const match = /(?:^|-)(\d+)$/.exec(slug.trim());
  return match ? match[1]! : null;
}

/** True when `slug` is already the canonical form for this record. */
export function isCanonicalSlug(
  slug: string,
  name: string | null | undefined,
  id: string | number,
): boolean {
  return slug === buildSlug(name, id);
}
