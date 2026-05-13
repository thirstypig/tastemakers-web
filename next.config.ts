import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.foursquare.com" },
      { protocol: "https", hostname: "fastly.4sqi.net" },
    ],
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
