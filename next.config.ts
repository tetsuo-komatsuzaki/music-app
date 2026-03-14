import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   experimental: {
    serverActions: {
      bodySizeLimit: "50mb",  // ← ここ追加
    },
  },
};

export default nextConfig;
