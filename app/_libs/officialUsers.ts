import "server-only"
import { prisma } from "./prisma"

/**
 * 公式 = 運営 (role admin) アカウント (2026-09-06 Tetsuo確定: Score に印は持たせず、運営の曲を公式とみなす)。
 * ライブラリの「公式」の印と、ゲストに見せる曲の範囲 (公式曲だけ) の両方で使う。
 */
export async function getOfficialUserIds(): Promise<Set<string>> {
  const rows = await prisma.user.findMany({ where: { role: "admin" }, select: { id: true } })
  return new Set(rows.map((r) => r.id))
}
