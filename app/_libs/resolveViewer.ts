import "server-only"
import { getUserIdsFromParams } from "./getUserIdsFromParams"
import { GUEST_ID, GUEST_VIEWER, type Viewer } from "./viewer"

/**
 * [userId] 配下の Server Component で「ログイン中の本人」か「ゲスト」かを解決する (2026-09-06)。
 * - `guest` なら DB を見ずにゲストとして返す
 * - それ以外は従来どおり getUserIdsFromParams (未ログイン→/login、他人のURL→自分のURL)
 * ゲスト対応したページだけがこれを使う。未対応ページは getUserIdsFromParams のままで、
 * ゲストが URL を直打ちすると /login に戻る (安全側)。
 */
export async function resolveViewer(params: { userId: string }): Promise<Viewer> {
  if (params.userId === GUEST_ID) return GUEST_VIEWER
  const ids = await getUserIdsFromParams(params)
  return { kind: "user", authUserId: ids.authUserId, dbUserId: ids.dbUserId }
}
