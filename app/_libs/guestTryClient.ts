// 「登録なしで 1 回ためす」の client 側 (2026-09-12 要件整理 v2.7 §2)。
// 匿名ユーザーを作り (Supabase signInAnonymously)、User 行 (role = guest) を用意して、本人 URL の曲詳細へ進む。
import { createBrowserSupabaseClient } from "./supabaseBrowser"
import { getDeviceKey } from "./deviceKey"
import { ensureGuestUser } from "@/app/actions/guestTry"

export type TryStart = { ok: true; href: string } | { ok: false; used: boolean; error: string }

export async function startGuestTry(scoreId: string): Promise<TryStart> {
  const supabase = createBrowserSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  let uid = session?.user?.id ?? null
  if (!uid) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) return { ok: false, used: false, error: "いま準備できませんでした。時間をおいてもう一度" }
    uid = data.user.id
  }
  const r = await ensureGuestUser(await getDeviceKey())
  if (r.error) return { ok: false, used: false, error: r.error }
  if (r.used) return { ok: false, used: true, error: "この端末では 1 回ためし済みです" }
  return { ok: true, href: `/${uid}/scores/${scoreId}` }
}
