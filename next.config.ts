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
  // Proxy to Laravel, but only as fallback — Next.js route handlers take precedence.
  // This lets /api/restaurants/[id]/tags etc. be served by Next.js while
  // /api/login, /api/restaurant-detail, etc. still proxy to Laravel.
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: "http://localhost:4050/api/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
