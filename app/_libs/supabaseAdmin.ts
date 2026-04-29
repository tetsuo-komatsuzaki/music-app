import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// 遅延初期化:
// モジュール読み込み時に createClient を呼ぶと、ビルドの "collect page data"
// フェーズで env が未注入だと失敗する (supabaseUrl is required)。
// 既存 storageAdmin.ts と同じ lazy パターン。
//
// storageAdmin との差分:
// - storage に加えて auth.admin も使えるよう全 client を expose
// - persistSession: false / autoRefreshToken: false (admin 操作用)

let cached: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url) {
      throw new Error(
        "[supabaseAdmin] NEXT_PUBLIC_SUPABASE_URL is not set. " +
          "Check Vercel project env vars (Production/Preview/Development).",
      )
    }
    if (!serviceKey) {
      throw new Error(
        "[supabaseAdmin] SUPABASE_SERVICE_ROLE_KEY is not set. " +
          "Check Vercel project env vars and Sensitive flag scope.",
      )
    }
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}

// auth と storage を proxy で expose (既存 storageAdmin と同じ書き味)
export const supabaseAdmin = {
  get auth() {
    return getAdminClient().auth
  },
  get storage() {
    return getAdminClient().storage
  },
}
