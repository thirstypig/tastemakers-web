import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
