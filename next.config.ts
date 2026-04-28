import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite uploads de fotos maiores via API routes
    middlewareClientMaxBodySize: 52428800, // 50MB
  },
};

export default nextConfig;
