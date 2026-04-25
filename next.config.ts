import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // workspace root を明示固定（OneDrive 配下等で親ディレクトリに別 lockfile が
  // ある場合、Next.js が workspace root を誤推定してファイル tracing パスが
  // 壊れる問題を回避）。process.cwd() は next CLI 起動時のプロジェクトルート。
  outputFileTracingRoot: process.cwd(),

  // Vercel のサーバーレス関数バンドルに ffmpeg-static のバイナリを含める
  // (デフォルトでは native binary が tracing から外れて含まれない)
  // 注: ** ではなく **/* を使うことでファイルも明示的に対象に含める
  outputFileTracingIncludes: {
    "/api/convert-audio": ["./node_modules/ffmpeg-static/**/*"],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
