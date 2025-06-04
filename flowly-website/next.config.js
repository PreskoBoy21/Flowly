/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checks enabled but make them less strict
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig 