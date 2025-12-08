/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Netlify deployment
  // Netlify uses its own Next.js runtime
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
