// シェア機能の実証用 (2026-08-03・使い捨て): 実データで4種のShareCardを作りtokenを出力
import { config } from "dotenv"
config()
import { randomBytes } from "crypto"
import { fmtMDJst, weekPeriodJst } from "../app/_libs/shareCard"

async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  // 採点済み演奏を1件 (daily用)
  const perf = await prisma.performance.findFirst({
    where: { pitchAccuracy: { not: null }, rangeFromNote: null },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, userId: true, pitchAccuracy: true, timingAccuracy: true, uploadedAt: true, score: { select: { title: true } } },
  })
  if (!perf) { console.log("no scored performance"); return }
  const mk = async (kind: string, payload: object, displayName: string | null = null) => {
    const token = randomBytes(12).toString("base64url")
    await prisma.shareCard.create({ data: { token, userId: perf.userId, kind, displayName, payload } })
    console.log(kind, "->", token)
  }
  await mk("daily", {
    title: perf.score.title, pitch: Math.round(perf.pitchAccuracy!), timing: Math.round(perf.timingAccuracy!),
    bestDelta: 6, date: fmtMDJst(perf.uploadedAt),
  })
  await mk("master", { title: perf.score.title, star: 2, attempts: 12 }, "ゆい")
  await mk("rank_up", { star: 2, fromStar: 1 })
  await mk("weekly", { period: weekPeriodJst(new Date()), days: 4, recs: 9, skills: 2 })
}
main()
