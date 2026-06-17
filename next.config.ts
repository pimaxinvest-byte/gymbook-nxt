import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
  },
  experimental: {
    // typedRoutes disabled temporarily to allow build (some routes like client/calendar stubbed)
    // typedRoutes: true,
  },
}

export default nextConfig
