import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const dbUsers = await prisma.user.findMany({
    select: {
      id: true, supabaseUserId: true, name: true, role: true, createdAt: true, deletedAt: true,
      _count: { select: { scores: true, performances: true, practicePerformances: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  // auth.users を raw で取り、email を突き合わせる
  let auth: Record<string, { email: string | null; created: string; last: string | null }> = {}
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id::text AS id, email, created_at, last_sign_in_at FROM auth.users`
    )
    for (const r of rows) auth[r.id] = {
      email: r.email ?? null,
      created: r.created_at ? new Date(r.created_at).toISOString().slice(0,10) : "—",
      last: r.last_sign_in_at ? new Date(r.last_sign_in_at).toISOString().slice(0,10) : null,
    }
    console.log(`auth.users 読み取り OK: ${rows.length} 件`)
  } catch (e) {
    console.log("auth.users 読み取り不可（emailは表示できません）:", String(e).slice(0,120))
  }

  console.log(`\nアプリDB User: ${dbUsers.length} 人\n`)
  console.log("No | email                          | 名前         | 権限    | 登録日     | 最終ﾛｸﾞｲﾝ  | 曲 | 演奏 | 退会")
  console.log("-".repeat(110))
  dbUsers.forEach((u, i) => {
    const a = auth[u.supabaseUserId]
    const email = a?.email ?? "(auth未取得)"
    const last = a?.last ?? "未ﾛｸﾞｲﾝ"
    const perf = u._count.performances + u._count.practicePerformances
    const del = u.deletedAt ? "退会" : ""
    console.log(
      `${String(i+1).padStart(2)} | ${email.padEnd(30)} | ${(u.name ?? "—").slice(0,10).padEnd(10)} | ${u.role.padEnd(6)} | ${u.createdAt.toISOString().slice(0,10)} | ${last.padEnd(10)} | ${String(u._count.scores).padStart(2)} | ${String(perf).padStart(3)} | ${del}`
    )
  })
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
