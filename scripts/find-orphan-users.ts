/**
 * 診断用（読み取り専用）: Prisma User のうち、Supabase Auth (auth.users) に
 * 対応するユーザーが存在しない「孤児行」を洗い出す。
 *
 * 背景: 旧 signUpAction は既存メール時に Supabase が返す難読化ユーザー
 * (identities=[], ランダム id) を新規成功と誤判定し、毎回ゴミ User 行を
 * 作っていた。本スクリプトはその残骸を特定する（削除はしない）。
 *
 * Auth 管理 API (admin.listUsers) は GoTrue 側で 500 になることがあるため、
 * 同一 DB の auth.users テーブルに直接 SQL で突き合わせる。
 *
 * 実行: npx tsx scripts/find-orphan-users.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

type OrphanRow = {
  id: string
  supabaseUserId: string
  name: string
  role: string
  createdAt: Date
  perf: number
  scores: number
  pPerf: number
}

async function main() {
  const authCount = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `select count(*)::int as c from auth.users`
  )
  const userCount = await prisma.user.count()

  const orphans = await prisma.$queryRawUnsafe<OrphanRow[]>(
    `
    select
      u.id,
      u."supabaseUserId",
      u.name,
      u.role::text as role,
      u."createdAt",
      (select count(*)::int from "Performance" p where p."userId" = u.id) as perf,
      (select count(*)::int from "Score" s where s."createdById" = u.id) as scores,
      (select count(*)::int from "PracticePerformance" pp where pp."userId" = u.id) as "pPerf"
    from "User" u
    left join auth.users a on a.id::text = u."supabaseUserId"
    where a.id is null
    order by u."createdAt" asc
    `
  )

  console.log(`auth.users 件数:    ${authCount[0].c}`)
  console.log(`Prisma User 件数:   ${userCount}`)
  console.log(`孤児行 (Auth不在):  ${orphans.length}`)
  console.log("")

  if (orphans.length === 0) {
    console.log("✓ 孤児行はありません。クリーンです。")
    return
  }

  console.log("── 孤児行の一覧（関連データ件数つき） ──")
  for (const o of orphans) {
    const hasData = o.perf + o.scores + o.pPerf > 0
    console.log(
      [
        `id=${o.id}`,
        `supabaseUserId=${o.supabaseUserId}`,
        `name=${o.name}`,
        `role=${o.role}`,
        `created=${new Date(o.createdAt).toISOString()}`,
        `perf=${o.perf} score=${o.scores} pPerf=${o.pPerf}`,
        hasData ? "⚠️関連データあり(削除注意)" : "関連データなし(削除安全)",
      ].join("  ")
    )
  }
  console.log("")
  console.log("※検出のみ。削除は内容確認のうえ別途実行してください。")
}

main()
  .catch((e) => {
    console.error("ERROR:", e?.message ?? e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
