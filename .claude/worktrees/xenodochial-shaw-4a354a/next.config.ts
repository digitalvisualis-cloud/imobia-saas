import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Permite uploads de fotos maiores via API routes (renomeado em Next 16)
    proxyClientMaxBodySize: 52428800, // 50MB
  },
  images: {
    remotePatterns: [
      // Permite next/image com fotos do Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
