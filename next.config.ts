import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel のサーバーレス関数バンドルに ffmpeg-static のバイナリを含める
  // (デフォルトでは native binary が tracing から外れて含まれない)
  outputFileTracingIncludes: {
    "/api/convert-audio": ["./node_modules/ffmpeg-static/**"],
  },
   experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
