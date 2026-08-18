import type { NextConfig } from "next";

/**
 * The Laravel API that the legacy iOS shim forwards to.
 *
 * Hardcoded for production on purpose. This destination is the only thing
 * reviving the shipped App Store binaries, and an env var that is unset or
 * stale on Railway would break them silently — which is exactly SOL-006, where
 * a fallback rewrite to `http://localhost:4050` shipped to production and
 * turned every unmatched `/api/*` request into a 500. A shim whose whole job is
 * to be reachable should not depend on configuration being right.
 *
 * If the API host ever moves, change this line in the same commit.
 */
const PROD_API_ORIGIN = "https://api.tastemakersapp.com/api";

/**
 * Development only: point the shim at a local Laravel instead.
 *
 * Without this, `curl localhost:3050/v2/api/...` proxies straight into the
 * PRODUCTION database — a write path, and the way this shim was originally
 * verified. Deliberately keyed on `development` rather than "not production",
 * so test runs and every build resolve to PROD_API_ORIGIN and the guard test
 * can assert the real destination.
 */
const API_ORIGIN =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || PROD_API_ORIGIN
    : PROD_API_ORIGIN;

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.foursquare.com" },
      { protocol: "https", hostname: "fastly.4sqi.net" },
      // User-uploaded restaurant photos, served from Laravel's public dir.
      { protocol: "https", hostname: "api.tastemakersapp.com", pathname: "/storage/**" },
    ],
  },
  async redirects() {
    // NOTHING here may capture /v2/api/*. Redirects run BEFORE rewrites, so a
    // redirect matching that prefix wins over the shim below — and a 301 on a
    // POST is downgraded to GET by URLSession, which silently breaks login,
    // signup and every write from the shipped iOS build while still looking
    // like a healthy 3xx in logs. The obvious candidate is an apex -> www
    // canonicalisation: if you ever add one, exempt /v2/api explicitly.
    // api-routes.test.ts enforces this.
    return [
      { source: "/tech",      destination: "/admin/tech",      permanent: true },
      { source: "/status",    destination: "/admin/status",    permanent: true },
      { source: "/roadmap",   destination: "/admin/roadmap",   permanent: true },
      { source: "/changelog", destination: "/admin/changelog", permanent: true },
      { source: "/analytics", destination: "/admin/analytics", permanent: true },

      // Legacy URLs burned into the SHIPPED iOS build (Constant.swift) and the
      // old Namecheap marketing site. These are not ours to change — the App
      // Store binary asks for them literally, and old versions stay installed
      // for months. /privacy-policy in particular is the privacy link Apple
      // requires to resolve, so a 404 there is a compliance problem, not a
      // cosmetic one.
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/review-tag",     destination: "/review",  permanent: true },
      { source: "/about-us",       destination: "/",        permanent: true },
    ];
  },

  // Legacy iOS shim. The shipped App Store binary builds every request from
  //   NetworkManager.swift:14  baseUrl = "https://tastemakersapp.com/v2/api/"
  // — the old Namecheap layout (Laravel in a /v2/ subdirectory), dead since the
  // move to Railway. Old versions stay installed for months, so this cannot be
  // fixed by shipping a new build: do not delete this rewrite. Removal is
  // gated on TASK-24.
  //
  // This DOES expose the whole Laravel API surface on this domain — deliberately,
  // because the shipped binaries require it. It is not "narrow" in the security
  // sense; it is narrow only in that it cannot shadow this app's own /api/*
  // handlers in src/app/api, which keeps an unmatched path a 404 instead of a
  // 500. The compensating control is in src/middleware.ts, which strips cookies
  // and forces JSON content negotiation on this prefix.
  //
  // Only /v2/api is forwarded. /v2/storage/app/public/profile_image/ is also
  // hardcoded in the app but 404s on every host — those files never left the
  // Namecheap disk, so there is nothing to forward to. TODO(TASK-20).
  async rewrites() {
    return [
      {
        source: "/v2/api/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },

  experimental: {
    // Next truncates a proxied request body past this limit (default 10 MB)
    // while still forwarding the original Content-Length, so Laravel blocks
    // waiting for bytes that never arrive until proxyTimeout fires. Measured:
    // an 11 MB upload returned a plain-text 500 after 37s through the shim
    // versus a parseable 413 in 10s direct. Keep this ABOVE whatever Laravel
    // accepts so the 413 comes back fast from Laravel rather than slowly from
    // a truncated stream.
    middlewareClientMaxBodySize: 32 * 1024 * 1024,
    // iOS sets both URLSession timeouts to 60s (NetworkManager.swift:88-89),
    // so anything above that is unreachable in practice.
    proxyTimeout: 45_000,
  },
};

export default nextConfig;
