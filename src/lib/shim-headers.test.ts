import { describe, expect, it } from "vitest";
import { sanitizeShimHeaders } from "./shim-headers";

/**
 * The `/v2/api` shim forwards the shipped iOS build's traffic to the Laravel API
 * (see `next.config.ts`). Next preserves client-supplied request headers across
 * a rewrite rather than overwriting them, so anything the caller sends arrives
 * at Laravel looking like it came from our own edge.
 *
 * `src/middleware.ts` has stripped `x-forwarded-for` and `x-forwarded-host` on
 * this prefix since 2026-08-18, as defence in depth for the day Laravel starts
 * trusting proxies (root todo 123 / backend `TrustProxies`).
 *
 * **That strip was aimed at the wrong header.** Railway's published request
 * specification (docs.railway.com/networking/public-networking/specs-and-limits,
 * checked 2026-08-20) lists what its edge actually sets:
 *
 *     X-Real-IP          for identifying client's remote IP
 *     X-Forwarded-Proto  always indicates https
 *     X-Forwarded-Host   for identifying the original host header
 *
 * `X-Forwarded-For` is **not in that list at all**. `X-Real-IP` is the header
 * that carries the caller's address on this platform, and it was the one header
 * of the set that the middleware did not delete — so a caller could set it
 * freely and have it survive the shim. Root todo 123's Option A is written
 * against `X-Forwarded-For` and is wrong on the same point.
 *
 * These tests pin the whole class rather than the two headers that happened to
 * be listed first. `project_half_applied_fixes` is the recurring bug shape in
 * this codebase: a correct fix applied at one site and not its siblings.
 */

/** Build the header set a hostile caller would send through the shim. */
function hostileHeaders(): Headers {
  return new Headers({
    "cookie": "sb-access-token=real-session; sb-refresh-token=real-refresh",
    "content-type": "application/json",
    "user-agent": "TasteMaker/1.2.1 (iPhone; iOS 17.0)",
    "x-real-ip": "203.0.113.9",
    "x-forwarded-for": "203.0.113.9",
    "x-forwarded-host": "evil.example.com",
    "forwarded": 'for=203.0.113.9;host=evil.example.com;proto=https',
  });
}

describe("sanitizeShimHeaders — client-supplied identity headers", () => {
  it("deletes x-real-ip, the header Railway actually uses for the client address", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("x-real-ip")).toBeNull();
  });

  it("deletes x-forwarded-for", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("x-forwarded-for")).toBeNull();
  });

  it("deletes x-forwarded-host, which lands in password-reset link generation", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("x-forwarded-host")).toBeNull();
  });

  it("deletes the RFC 7239 `forwarded` header, which carries the same claims", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("forwarded")).toBeNull();
  });

  it("leaves no header that asserts a caller address or origin host", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    const surviving = [...out.keys()].filter((k) =>
      /^(forwarded|x-real-ip|x-forwarded-(for|host))$/.test(k),
    );
    expect(surviving).toEqual([]);
  });
});

describe("sanitizeShimHeaders — session and content negotiation", () => {
  it("deletes the Cookie header so Supabase tokens never reach the Laravel host", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("cookie")).toBeNull();
  });

  it("forces Accept: application/json so Laravel returns 401 rather than a 302 to http://", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("accept")).toBe("application/json");
  });

  it("overrides an Accept the caller chose, rather than appending to it", () => {
    const h = hostileHeaders();
    h.set("accept", "text/html");
    expect(sanitizeShimHeaders(h).get("accept")).toBe("application/json");
  });
});

describe("sanitizeShimHeaders — what it must not touch", () => {
  it("preserves Content-Type, which the shipped client sets and Laravel needs", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("content-type")).toBe("application/json");
  });

  it("preserves User-Agent", () => {
    const out = sanitizeShimHeaders(hostileHeaders());
    expect(out.get("user-agent")).toBe("TasteMaker/1.2.1 (iPhone; iOS 17.0)");
  });

  it("preserves Authorization — the shim's entire job is carrying the bearer token", () => {
    const h = hostileHeaders();
    h.set("authorization", "Bearer abc123");
    expect(sanitizeShimHeaders(h).get("authorization")).toBe("Bearer abc123");
  });

  it("does not mutate the Headers object it was given", () => {
    const original = hostileHeaders();
    sanitizeShimHeaders(original);
    expect(original.get("x-real-ip")).toBe("203.0.113.9");
    expect(original.get("cookie")).not.toBeNull();
  });
});
