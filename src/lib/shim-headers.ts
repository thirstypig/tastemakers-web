/**
 * Headers a caller must not be able to assert through the `/v2/api` shim.
 *
 * Every one of these is read by a proxy-aware framework as a statement about
 * *who* the caller is or *which host* they asked for. Next preserves inbound
 * request headers across a rewrite rather than overwriting them, so anything
 * left here arrives at Laravel indistinguishable from a value our own edge set.
 *
 * The list is the whole class on purpose, not the members that happen to be
 * implicated today:
 *
 * - `x-real-ip` — **the one that actually matters on Railway.** Railway's
 *   published request spec (docs.railway.com/networking/public-networking/
 *   specs-and-limits, checked 2026-08-20) names `X-Real-IP` as the header its
 *   edge sets for the client's remote address. It does not list
 *   `X-Forwarded-For` at all. This header was missing from the original strip.
 * - `x-forwarded-for` — the header root todo 123's Option A is written against.
 *   Inert on Railway per the above, but Symfony reads it whenever
 *   `TrustProxies::$proxies` is non-null, so it stays on the list.
 * - `x-forwarded-host` — lands in Laravel's generated absolute URLs, including
 *   password-reset links.
 * - `forwarded` — RFC 7239 carries `for=` and `host=` claims in one header and
 *   is the standards-track spelling of the two above.
 *
 * `x-forwarded-proto` is deliberately NOT stripped. Railway always sets it to
 * `https`, `AppServiceProvider` pins the scheme with `URL::forceScheme()`
 * regardless, and removing it risks changing how Next itself resolves the
 * request. It asserts a scheme, not an identity.
 */
const SPOOFABLE_IDENTITY_HEADERS = [
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-real-ip",
] as const;

/**
 * Strip a `/v2/api` request down to what the Laravel API should be allowed to
 * believe about its caller.
 *
 * Three separate problems, all specific to this prefix:
 *
 * 1. **Cookies.** The inbound `Cookie` header carries the browser's Supabase
 *    `sb-*` access and refresh tokens. Forwarding them sends a live session to
 *    `api.tastemakersapp.com`, a host `@supabase/ssr`'s host-only cookies could
 *    never otherwise reach.
 *
 * 2. **Content negotiation.** The shipped iOS build sets `Content-Type` but
 *    never `Accept`, so Laravel's `expectsJson()` is false and an expired token
 *    returns `302 -> http://api.tastemakersapp.com/...`. The app ships no
 *    NSAppTransportSecurity exception, so ATS blocks that plaintext hop and the
 *    user cannot tell "session expired" from "network down". Forcing `Accept`
 *    turns it into a 401 the app already handles — with no App Store release.
 *
 * 3. **Caller identity.** See `SPOOFABLE_IDENTITY_HEADERS` above.
 *
 * Returns a new `Headers`; the input is not mutated.
 */
export function sanitizeShimHeaders(incoming: Headers): Headers {
  const headers = new Headers(incoming);

  headers.delete("cookie");
  headers.set("accept", "application/json");

  for (const name of SPOOFABLE_IDENTITY_HEADERS) {
    headers.delete(name);
  }

  return headers;
}
