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
