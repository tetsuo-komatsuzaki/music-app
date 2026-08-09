import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import { getLessonInventory, getUserLessonState } from "@/app/_libs/lessonStatus"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function step(name: string, fn: () => Promise<unknown>) {
  try { const r = await fn(); console.log(`OK  ${name}:`, typeof r === "string" ? r.slice(0,40) : (r === null ? "null" : "ok")); return r }
  catch (e) { console.log(`★NG ${name}:`, e instanceof Error ? e.message : String(e)); throw e }
}

async function main() {
  const scoreId = "cmq3x0qed000304l7noqf4wmi"
  const userSupa = "16c0f52b-3000-4beb-ad66-0454a8b4ec85" // テスト1
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: userSupa }, select: { id: true } })
  const score = await prisma.score.findFirst({ where: { id: scoreId, deletedAt: null } })
  console.log("dbUser:", dbUser?.id, "score.owner:", score?.createdById, "isShared:", (score as any)?.isShared)
  if (!dbUser || !score) { console.log("前提NG"); return }

  await step("buildUrl(署名)", () =>
    storageAdmin.storage.from("musicxml").createSignedUrl(score.generatedXmlPath!, 300)
      .then(r => encodeSignedUrl(r.data?.signedUrl)))
  await step("getLessonInventory", () => getLessonInventory())
  await step("getUserLessonState", () => getUserLessonState(dbUser.id))
  await step("performance.count", () => prisma.performance.count({ where: { userId: dbUser.id, scoreId } }))
  await step("userScoreAchievement", () => prisma.userScoreAchievement.findUnique({ where: { userId_scoreId: { userId: dbUser.id, scoreId } }, select: { achievedAt: true } }))
  await step("favorite", () => prisma.favorite.findUnique({ where: { userId_scoreId: { userId: dbUser.id, scoreId: score.id } }, select: { id: true } }))
  console.log("\n=== サーバー側の取得は全て成功 → エラーはクライアント側 ===")
}
main().catch(() => { console.log("\n=== ★ サーバー側で例外 → これが500の原因 ===") }).finally(() => prisma.$disconnect())
