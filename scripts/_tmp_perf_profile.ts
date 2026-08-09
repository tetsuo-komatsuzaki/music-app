// カルテ重さの実測プロファイル (読み取りのみ)
import { config } from "dotenv"
config()

async function main() {
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

  const t = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const s = performance.now()
    const r = await fn()
    const ms = Math.round(performance.now() - s)
    const size = (() => { try { return Math.round(JSON.stringify(r).length / 1024) } catch { return -1 } })()
    console.log(`${name.padEnd(34)} ${String(ms).padStart(5)}ms  payload≈${size}KB`)
    return r
  }

  // ベースラインRTT
  await t("RTT: SELECT 1 (1回目)", () => prisma.$queryRaw`SELECT 1`)
  await t("RTT: SELECT 1 (2回目)", () => prisma.$queryRaw`SELECT 1`)

  const link = await prisma.teacherStudent.findFirst({ select: { teacherId: true, student: { select: { id: true, supabaseUserId: true } } } })
  const userId = link!.student.id

  console.log("--- buildKarteData 相当の内訳 ---")
  const perfs = await t("perfs(全録音+analysisSummary)", () =>
    prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true, score: { select: { keyTonic: true, keyMode: true } } } }))
  await t("pracs(同上)", () =>
    prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true, practiceItem: { select: { category: true, keyTonic: true, keyMode: true } } } }))
  await t("allPerfDates", () => prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true } }))
  await t("allPracDates", () => prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true } }))
  await t("achievements", () => prisma.userScoreAchievement.findMany({ where: { userId }, take: 30, select: { achievedAt: true, masteredAt: true, score: { select: { title: true } } } }))
  await t("teacherLink", () => prisma.teacherStudent.findFirst({ where: { studentId: userId }, select: { teacherId: true, teacher: { select: { name: true } } } }))
  await t("events4本(並列)", () => Promise.all([
    prisma.assignment.findMany({ where: { studentId: userId, submittedAt: { not: null } }, take: 15, select: { submittedAt: true, submittedScore: true, score: { select: { title: true } }, practiceItem: { select: { title: true } } } }),
    prisma.teacherFeedback.findMany({ where: { studentId: userId }, take: 10, select: { updatedAt: true, scoreId: true } }),
    prisma.teacherObservation.findMany({ where: { studentId: userId }, take: 15, select: { createdAt: true, tagIds: true, severity: true } }),
    prisma.message.findMany({ where: { studentId: userId, kind: "celebration" }, take: 10, select: { createdAt: true, body: true } }),
  ]))
  await t("skillMap3本(並列)", () => Promise.all([
    prisma.userLessonClear.findMany({ where: { userId }, select: { tagType: true, tagKey: true } }),
    prisma.userTagAcquisition.findMany({ where: { userId }, select: { tagType: true, tagKey: true } }),
    prisma.userStarProgress.findUnique({ where: { userId }, select: { currentStar: true } }),
  ]))

  // JSONの重さ
  let bytes = 0
  for (const p of perfs) bytes += p.analysisSummary ? JSON.stringify(p.analysisSummary).length : 0
  console.log(`analysisSummary合計: ${Math.round(bytes / 1024)}KB / ${perfs.length}件`)

  console.log("--- 全体(buildKarteData本体) ---")
  const { buildKarteData } = await import("../app/_libs/growthKarte")
  await t("buildKarteData(30d) 1回目", () => buildKarteData(userId, link!.student.supabaseUserId, "30d"))
  await t("buildKarteData(30d) 2回目", () => buildKarteData(userId, link!.student.supabaseUserId, "30d"))
  await t("buildKarteData(all)", () => buildKarteData(userId, link!.student.supabaseUserId, "all"))

  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
