import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// 遅延初期化:
// モジュール読み込み時に createClient を呼ぶと、ビルドの "collect page data"
// フェーズで env が未注入だと失敗する (supabaseUrl is required)。
// 初回アクセス時にだけ生成しキャッシュする。
let cached: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) {
      throw new Error(
        "[storageAdmin] NEXT_PUBLIC_SUPABASE_URL is not set. " +
          "Check Vercel project env vars (Production/Preview/Development).",
      )
    }
    if (!serviceKey) {
      throw new Error(
        "[storageAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
          "Check Vercel project env vars and Sensitive flag scope.",
      )
    }
    cached = createClient(url, serviceKey)
  }
  return cached
}

// 既存の `storageAdmin.storage.from(...)` API を維持
export const storageAdmin = {
  get storage() {
    return getClient().storage
  },
}
