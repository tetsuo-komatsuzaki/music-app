import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const SUPA_ID = "39087edc-c314-48a9-bc7e-34bfc1376e68" // #11

async function main() {
  const u = await prisma.user.findUnique({
    where: { supabaseUserId: SUPA_ID },
    select: {
      id: true, name: true, role: true, createdAt: true, deletedAt: true,
      _count: {
        select: {
          scores: true, performances: true, practiceItems: true, practicePerformances: true,
          favorites: true, weaknesses: true, feedbacks: true, songRequests: true,
          lessonClears: true, tagAcquisitions: true,
        },
      },
    },
  })
  if (!u) { console.log("アプリDBには User 行なし (Auth のみ削除でOK)"); return }
  console.log("=== 削除対象 (#11) のアプリDB フットプリント ===")
  console.log(`  User.id     : ${u.id}`)
  console.log(`  名前 / 権限 : ${u.name} / ${u.role}`)
  console.log(`  登録 / 退会 : ${u.createdAt.toISOString().slice(0,10)} / ${u.deletedAt ?? "未退会"}`)
  console.log(`  関連レコード:`)
  Object.entries(u._count).forEach(([k,v]) => { if (v) console.log(`     ${k}: ${v}`) })
  const total = Object.values(u._count).reduce((a,b)=>a+(b as number),0)
  console.log(`  → 関連レコード合計: ${total} 件`)
  console.log(`\n※ scores/performances が 0 = 実演奏データ無し。安全に削除できます。`)
}
main().catch((e)=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect())
