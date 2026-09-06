/**
 * viewer.ts — 「いま画面を見ているのは誰か」(2026-09-06 ゲスト閲覧)。
 *
 * URL の [userId] に予約語 `guest` が入っているとき、その画面は未ログインの訪問者向け。
 * ゲストは一覧を見られるが、曲・教材を開く・録音する・自分の記録を見る操作の前で
 * 登録かログインを促す (GateSheet)。DB には何も書かない。
 *
 * ゲストは `guest` という文字列そのもので識別する。Supabase の auth uuid は 36 文字の 16 進なので
 * 実ユーザーと衝突しない (middleware の /[UUID]/* 検証にも掛からず、そのまま通る)。
 */
export const GUEST_ID = "guest"

export function isGuestId(id: string | null | undefined): boolean {
  return id === GUEST_ID
}

export type Viewer =
  | { kind: "user"; authUserId: string; dbUserId: string }
  | { kind: "guest"; authUserId: typeof GUEST_ID; dbUserId: null }

export const GUEST_VIEWER: Viewer = { kind: "guest", authUserId: GUEST_ID, dbUserId: null }

/**
 * ゲストで既存の読み込みをそのまま通すための「存在しない DB ユーザー ID」。
 * userId で絞る問い合わせ (演奏・達成・お気に入り …) がすべて空になる。cuid の形にして型・長さの検証を通す。
 * これで書き込みが起きない前提: ゲスト対応ページは読み取りだけを行い、操作はゲートで止める。
 */
export const GUEST_DB_PLACEHOLDER = "cguest000000000000000000"
