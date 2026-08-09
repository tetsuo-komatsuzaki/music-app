import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw error
  const users = data.users.sort((a,b)=>(a.created_at??"").localeCompare(b.created_at??""))

  // アプリDB側の活動量を突き合わせ
  const dbUsers = await prisma.user.findMany({
    select: { supabaseUserId: true, name: true, deletedAt: true,
      _count: { select: { scores: true, performances: true, practicePerformances: true } } },
  })
  const byS = new Map(dbUsers.map(u=>[u.supabaseUserId, u]))

  console.log(`Auth ユーザー: ${users.length} 人 (ログインできる本物)\n`)
  console.log("No| email                          | 登録日     | 最終ﾛｸﾞｲﾝ  | 曲 | 演奏 | 名前")
  console.log("-".repeat(96))
  users.forEach((u,i)=>{
    const d = byS.get(u.id)
    const reg = (u.created_at??"").slice(0,10)
    const last = u.last_sign_in_at ? u.last_sign_in_at.slice(0,10) : "未ﾛｸﾞｲﾝ"
    const perf = (d?._count.performances??0)+(d?._count.practicePerformances??0)
    const sc = d?._count.scores??0
    const del = d?.deletedAt ? " 退会" : ""
    console.log(`${String(i+1).padStart(2)}| ${(u.email??"—").padEnd(30)} | ${reg} | ${last.padEnd(10)} | ${String(sc).padStart(2)} | ${String(perf).padStart(3)} | ${d?.name??"(DB無)"}${del}`)
  })
}
main().catch((e)=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect())
