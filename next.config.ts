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
  // API requests proxy to Laravel backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4050/api/:path*",
      },
    ];
  },
};

export default nextConfig;
