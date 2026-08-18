/**
 * The single source of truth for this site's public canonical origin.
 *
 * Every `rel=canonical`, `og:url`, JSON-LD `url` and sitemap entry derives from
 * here, so moving the site to a new domain is one environment variable rather
 * than a hunt through fifteen files.
 *
 * ── Why this is NOT `NEXT_PUBLIC_SITE_URL` ──────────────────────────────────
 *
 * `NEXT_PUBLIC_SITE_URL` already exists and is consumed by
 * `resolveCallbackOrigin` in `src/lib/auth.ts`. It answers a different
 * question, and the two must not be merged:
 *
 *   NEXT_PUBLIC_SITE_URL        "where is THIS RUNNING INSTANCE reachable?"
 *                               Correctly `http://localhost:3050` in dev —
 *                               an OAuth callback has to come back to the
 *                               machine that sent the user away.
 *
 *   NEXT_PUBLIC_CANONICAL_ORIGIN  "what is the PUBLIC HOME of this content?"
 *                               Always the production domain, even when the
 *                               build runs on a laptop. A local build must
 *                               never emit `<link rel=canonical
 *                               href="http://localhost:3050/...">`.
 *
 * Reusing the auth variable would make any local `next build` publish
 * localhost canonicals and a localhost sitemap — deindexing bait if such a
 * build ever shipped.
 *
 * ── Deploying a domain change ───────────────────────────────────────────────
 *
 * `NEXT_PUBLIC_*` values are inlined into the bundle at BUILD time, not read
 * at runtime. Setting this on Railway therefore requires a redeploy before it
 * takes effect. It is also why the reference below is written out in full:
 * Next.js performs a literal textual substitution on
 * `process.env.NEXT_PUBLIC_CANONICAL_ORIGIN`, so destructuring or dynamic
 * indexing would silently yield `undefined` in the browser bundle.
 */
const DEFAULT_ORIGIN = "https://app.tastemakersapp.com";

function normaliseOrigin(raw: string | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}

export const CANONICAL_ORIGIN: string =
  normaliseOrigin(process.env.NEXT_PUBLIC_CANONICAL_ORIGIN) ?? DEFAULT_ORIGIN;

/**
 * Builds an absolute canonical URL for a site-relative path.
 *
 *   canonical()                    → https://app.tastemakersapp.com/
 *   canonical("/lists")            → https://app.tastemakersapp.com/lists
 *   canonical("restaurants/x-1")   → https://app.tastemakersapp.com/restaurants/x-1
 *   canonical("/lists/")           → https://app.tastemakersapp.com/lists
 *
 * The root keeps its trailing slash because that is what the pages already
 * emit and what Google has indexed; every other path is normalised without
 * one, so `/lists` and `/lists/` can never disagree about which is canonical.
 */
export function canonical(path: string = "/"): string {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  const trimmed = withLeadingSlash.replace(/\/+$/, "");
  return trimmed === "" ? `${CANONICAL_ORIGIN}/` : `${CANONICAL_ORIGIN}${trimmed}`;
}
