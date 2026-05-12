import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Standalone gera um bundle minimal em .next/standalone — usado pelo Dockerfile
  // pra ter imagem leve (~200MB) em vez de copiar node_modules inteiro.
  output: 'standalone',
  // Forca tracing root no diretorio atual (evita Next achar lockfile de monorepo
  // pai e bagunçar paths do standalone)
  outputFileTracingRoot: path.join(__dirname),
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
