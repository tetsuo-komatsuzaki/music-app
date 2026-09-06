/**
 * knownUser — 「この端末でログインしたことがある人」の記録 (2026-09-06 Tetsuo確定)。
 *
 * 登録済みだがいまはログインしていない人には、見本ではなく <b>その人がログイン中に見ていたホーム</b> をそのまま見せる。
 * そのため、ログイン中の本人がホームを開くたびに、ホームの描画に使ったデータの写し (snapshot) を端末の localStorage に残す。
 * ログアウト後は写しでホームを描き、ログインが要る先 (曲・教材・カルテ・先生 …) はゲートのシートで止める。
 *
 * 端末にだけ置き、サーバーには送らない。消すのは アカウント削除のときだけ (ログアウトでは消さない)。
 */
export const KNOWN_USER_KEY = "arcoda_known_user"

export type KnownUser = {
  name: string
  /** ホーム (HomeClient) の props の写し。祝い演出の待ち行列と案内は空にしてある */
  snapshot: Record<string, unknown> | null
  updatedAt: string
}

export function readKnownUser(): KnownUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KNOWN_USER_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as KnownUser
    if (!v || typeof v !== "object" || typeof v.name !== "string") return null
    return v
  } catch {
    return null
  }
}

export function writeKnownUser(v: Omit<KnownUser, "updatedAt">): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KNOWN_USER_KEY, JSON.stringify({ ...v, updatedAt: new Date().toISOString() }))
  } catch { /* 容量超過などで保存できない端末では、写しなしで名前だけ残す */
    try { window.localStorage.setItem(KNOWN_USER_KEY, JSON.stringify({ name: v.name, snapshot: null, updatedAt: new Date().toISOString() })) } catch { /* noop */ }
  }
}

export function clearKnownUser(): void {
  if (typeof window === "undefined") return
  try { window.localStorage.removeItem(KNOWN_USER_KEY) } catch { /* noop */ }
}

/** 描画前に判定できるよう、html 要素に印を付ける最小のスクリプト (GuestHome が inline で埋める) */
export const KNOWN_USER_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(KNOWN_USER_KEY)}))document.documentElement.setAttribute("data-known-user","1")}catch(e){}`

/** 曲ごとの達成状況 (ホームの「いま練習している曲」のゴールと基礎練) の写し。ログアウト後の描画に使う */
export const ACH_CACHE_PREFIX = "arcoda_ach_"
export function readAchCache<T>(scoreId: string): T | null {
  if (typeof window === "undefined") return null
  try { const raw = window.localStorage.getItem(ACH_CACHE_PREFIX + scoreId); return raw ? (JSON.parse(raw) as T) : null } catch { return null }
}
export function writeAchCache(scoreId: string, v: unknown): void {
  if (typeof window === "undefined") return
  try { window.localStorage.setItem(ACH_CACHE_PREFIX + scoreId, JSON.stringify(v)) } catch { /* noop */ }
}
