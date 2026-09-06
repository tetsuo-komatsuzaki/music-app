/**
 * returnTo — ゲートで止めた場所へ、ログインか登録のあとに戻すための受け渡し (2026-09-06)。
 *
 * ゲストが `/guest/scores/abc` でシートの「無料で登録」を押す → cookie に `/guest/scores/abc` を置く →
 * ログイン成功 / OAuth コールバック / オンボーディング完了 で cookie を読み、`/guest` を本人の ID に
 * 置き換えた `/<uid>/scores/abc` へ送る。cookie なので Google 認証の往復やメール確認をまたいでも残る。
 *
 * 安全: 受け取るのはサイト内の絶対パス (先頭 "/"・"//" 不可・制御文字なし) だけ。外部 URL は捨てる。
 * クライアント・サーバー両方から import できるよう、ここでは next/headers を使わない。
 */
import { GUEST_ID } from "./viewer"

export const RETURN_TO_COOKIE = "arcoda_return_to"
const MAX_AGE_SEC = 60 * 60 * 24   // 1 日 (メール確認をまたぐ)

export function safeReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  let p: string
  try { p = decodeURIComponent(raw) } catch { return null }
  if (!p.startsWith("/") || p.startsWith("//") || /[\s\\<>"'`]/.test(p) || p.length > 512) return null
  return p
}

/** `/guest/...` を本人の URL に。それ以外のパスはそのまま */
export function mapReturnToForUser(path: string, authUserId: string): string {
  if (path === `/${GUEST_ID}`) return `/${authUserId}`
  if (path.startsWith(`/${GUEST_ID}/`)) return `/${authUserId}` + path.slice(GUEST_ID.length + 1)
  return path
}

/** ゲートから登録・ログインへ向かうときに呼ぶ (ブラウザ専用) */
export function setReturnToCookie(path: string): void {
  if (typeof document === "undefined") return
  const safe = safeReturnPath(path)
  if (!safe) return
  document.cookie = `${RETURN_TO_COOKIE}=${encodeURIComponent(safe)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`
}

export function readReturnToCookie(): string | null {
  if (typeof document === "undefined") return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${RETURN_TO_COOKIE}=([^;]*)`))
  return m ? safeReturnPath(m[1]) : null
}

export function clearReturnToCookie(): void {
  if (typeof document === "undefined") return
  document.cookie = `${RETURN_TO_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

/** ログイン直後の行き先: cookie があればそこへ (ゲスト URL は本人の URL に置換)、無ければホーム */
export function resolveLoginDestination(authUserId: string, fromQuery?: string | null): string {
  const q = safeReturnPath(fromQuery ?? null)
  const c = readReturnToCookie()
  const path = q ?? c
  clearReturnToCookie()
  return path ? mapReturnToForUser(path, authUserId) : `/${authUserId}`
}
