/**
 * City constants.
 *
 * Kept out of `lib/api/index.ts` on purpose: that module imports the Supabase
 * server client, so a client component importing from it drags server-only
 * code into the browser bundle and breaks the build (see SOL-004).
 */

/** Cities offered in the header picker, plus free search. */
export const CITIES = [
  "Los Angeles",
  "New York",
  "Austin",
  "San Francisco",
  "Chicago",
  "Seattle",
  "Miami",
  "Houston",
] as const;

export const DEFAULT_CITY = "Los Angeles";
