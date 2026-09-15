import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // KYC document / payment proof screenshots can exceed the 1MB default.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
