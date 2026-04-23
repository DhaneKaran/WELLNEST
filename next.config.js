
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals = [...config.externals, "bcryptjs"];
    return config;
  },
  // Renamed from experimental.serverComponentsExternalPackages in Next.js 14.1+
  serverExternalPackages: ['@prisma/client'],
};

module.exports = nextConfig;
