"use server"
/**
 * ゲストの計測 (2026-09-06 Tetsuo確定: 自前で記録)。
 * 記録するのは 訪問 ・ シートが出た場所 ・ シートから登録/ログインへ進んだか/去ったか の回数だけ。
 * 個人には紐付けない (ID も cookie も持たない)。失敗しても画面には影響させない (表がまだ無い環境でも落とさない)。
 */
import { prisma } from "@/app/_libs/prisma"
import { GUEST_EVENT_KINDS, GUEST_PLACES, type GuestEventKind, type GuestPlace } from "@/app/_libs/guestEvents"

export async function recordGuestEvent(kind: GuestEventKind, place: GuestPlace, path?: string | null): Promise<void> {
  if (!(GUEST_EVENT_KINDS as readonly string[]).includes(kind)) return
  if (!(GUEST_PLACES as readonly string[]).includes(place)) return
  const safePath = typeof path === "string" && path.startsWith("/guest") && path.length <= 200 ? path.split("?")[0] : null
  try {
    await prisma.guestEvent.create({ data: { kind, place, path: safePath } })
  } catch {
    /* 計測は本体の邪魔をしない */
  }
}
