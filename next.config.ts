import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  // S-1 Commit 8: package.json の version を build-time に注入
  // (runtime import は禁止: クライアントバンドルに依存ツリー全体が混入するリスクあり)
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },

  // workspace root を明示固定（OneDrive 配下等で親ディレクトリに別 lockfile が
  // ある場合、Next.js が workspace root を誤推定してファイル tracing パスが
  // 壊れる問題を回避）。process.cwd() は next CLI 起動時のプロジェクトルート。
  outputFileTracingRoot: process.cwd(),

  // ffmpeg-static を Next.js のバンドル対象から除外し、runtime で require する。
  // これによりパッケージ内 __dirname が正しく解決され、ffmpeg バイナリへのパスが
  // バンドラーによって /ROOT/... に書き換えられる問題を回避。
  serverExternalPackages: ["ffmpeg-static"],

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

  // セキュリティヘッダ (2026-08-08 P1・多層防御)。
  // 注意: 録音があるため microphone=(self) は必須 (殺すと録音が壊れる)。
  // CSP は全面適用だと Stripe/Supabase/OSMD 等を壊すため、クリックジャッキング防御の
  // 核 (frame-ancestors) に絞る。script-src 等の本格CSPは別途検証してから。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; upgrade-insecure-requests" },
        ],
      },
    ]
  },
};

export default nextConfig;
