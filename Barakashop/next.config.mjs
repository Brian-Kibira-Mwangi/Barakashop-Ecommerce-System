import MiniCssExtractPlugin from "mini-css-extract-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // If you're using Strict Mode (recommended)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(new MiniCssExtractPlugin());
    }
    return config;
  },
  images: {
    minimumCacheTTL: 60,
    domains: ['localhost'], // Your Strapi server's domain/IP address
  },
};

export default nextConfig;