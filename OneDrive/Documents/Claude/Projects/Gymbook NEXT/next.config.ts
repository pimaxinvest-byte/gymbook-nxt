import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
