import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PPR requires Next.js canary — enable on Vercel by using canary channel
  // experimental: { ppr: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

export default nextConfig;
