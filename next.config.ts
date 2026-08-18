import type { NextConfig } from "next";

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
  // ── Legacy iOS compatibility shim ──────────────────────────────────────────
  //
  // The SHIPPED App Store binary builds every request from
  //   NetworkManager.swift:14  baseUrl = "https://tastemakersapp.com/v2/api/"
  // That path was the Namecheap layout (Laravel installed in a /v2/
  // subdirectory). It has not existed since the move to Railway, so every API
  // call from the live app 404s — which is consistent with zero tags created
  // in 2026.
  //
  // Old iOS versions stay installed for months, so this cannot be fixed by
  // shipping a new build alone. The apex serves this app, so we can forward
  // the legacy prefix to the real API and revive binaries already in the wild.
  //
  // Endpoint names map 1:1 — verified against the live host: login, signup,
  // google-login, apple-login, user, restaurants, restaurant-detail,
  // gettastemaker-List, restaurant-image-list and the rest all resolve under
  // /api/ on api.tastemakersapp.com.
  //
  // Deliberately NARROW. This is not the /api/:path* catch-all that was
  // removed for 500ing in production: it forwards one dead legacy prefix and
  // nothing else. This app's own /api/* routes are untouched and still served
  // by src/app/api. api-routes.test.ts enforces that distinction.
  //
  // NOT fixed here: the app also hardcodes
  //   /public/storage/profile_image/  and  /v2/storage/app/public/profile_image/
  // Those files 404 on every host — they lived on the Namecheap disk and were
  // never migrated to object storage, so there is nothing to forward to.
  // Avatars stay broken until TASK-20 lands.
  async rewrites() {
    return [
      {
        source: "/v2/api/:path*",
        destination: "https://api.tastemakersapp.com/api/:path*",
      },
    ];
  },

  // NO /api proxy. This app does not call the Laravel API — every data path
  // goes to Supabase directly (see TODO-089), and every /api/* route it fetches
  // is a Next.js route handler in src/app/api. There was previously a fallback
  // rewrite to http://localhost:4050, which does not exist in production: any
  // unmatched /api/* path returned 500 Internal Server Error instead of an
  // honest 404. Do not reinstate it. Pointing it at api.tastemakersapp.com
  // would be worse — it would expose the whole Laravel surface through this
  // domain, with the auth-header and CORS questions that implies.
  // api-routes.test.ts fails if a fetch is added for a path with no handler.
};

export default nextConfig;
