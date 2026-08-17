/** Longest search term we'll send to the database. */
export const SEARCH_MAX_LENGTH = 80;

/**
 * Make a user-typed query safe to embed in a PostgREST filter.
 *
 * PostgREST's `or=(...)` filters are a comma-delimited, paren-wrapped string,
 * and `*` / `%` are the LIKE wildcards. A raw query containing any of those
 * doesn't just fail to match — it changes the shape of the filter and can
 * silently widen it (a lone `*` matches everything). Strip the delimiters
 * rather than escaping them: none of them are useful in a restaurant search.
 *
 * Returns "" when nothing usable is left, which callers treat as "no query".
 */
export function sanitizeSearchTerm(input: string): string {
  return input
    .replace(/[,()*%\\"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SEARCH_MAX_LENGTH)
    .trim();
}

/** Build the LIKE pattern PostgREST expects, with `*` as the wildcard. */
export function likePattern(term: string): string {
  return `*${term}*`;
}

export type SearchSegment = "restaurants" | "lists" | "tags";

export const SEARCH_SEGMENTS: readonly SearchSegment[] = ["restaurants", "lists", "tags"];

export function isSearchSegment(value: string | undefined): value is SearchSegment {
  return value === "restaurants" || value === "lists" || value === "tags";
}

export function segmentLabel(segment: SearchSegment): string {
  return segment === "restaurants" ? "Restaurants" : segment === "lists" ? "Lists" : "Tags";
}
