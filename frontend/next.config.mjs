/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev, isServer }) => {
    // Fix source map issue
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    return config;
  },
}

export default nextConfig
