/**
 * Postgres error-shape helpers.
 *
 * Lives here rather than in the route file because Next.js route modules may
 * only export request handlers — any other export fails the build's type check.
 */

/**
 * True for a unique-constraint breach.
 *
 * Postgres reports these as
 *   duplicate key value violates unique constraint "<name>"
 * (verified against production's restaurant_tag_restaurant_tag_unique).
 *
 * Deliberately stricter than `message.includes("duplicate")`, which also
 * matched unrelated errors that merely mention the word.
 */
export function isUniqueViolation(message: string): boolean {
  return /duplicate key value violates unique constraint/i.test(message);
}
