/**
 * 調査用（読み取り専用）: auth.users と Prisma User の全体像を突き合わせる。
 * - auth.users 全件（email/作成日/最終ログイン/確認状態/メタ名）と Prisma 対応有無
 * - Prisma User 全件と auth 対応有無（孤児特定）
 * - 注目アカウント（37演奏の孤児）の素性（演奏・譜面の中身）
 *
 * 実行: npx tsx scripts/investigate-users.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const FOCUS_ORPHAN = "dc2876e0-90a4-4bf1-9961-a5114ef93580" // 37演奏の孤児

function q<T = any>(sql: string) {
  return prisma.$queryRawUnsafe<T[]>(sql)
}

async function main() {
  // ── 1. auth.users 全件 + Prisma 対応 ──
  const authUsers = await q(`
    select
      a.id::text                              as id,
      a.email                                 as email,
      a.created_at                            as created_at,
      a.last_sign_in_at                       as last_sign_in_at,
      (a.email_confirmed_at is not null)      as confirmed,
      a.raw_user_meta_data->>'name'           as meta_name,
      (select count(*)::int from "User" u where u."supabaseUserId" = a.id::text) as prisma_rows
    from auth.users a
    order by a.created_at asc
  `)

  console.log("=== auth.users 全件（", authUsers.length, "件） ===")
  for (const u of authUsers) {
    console.log(
      [
        `email=${u.email}`,
        `created=${u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : "?"}`,
        `lastLogin=${u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString().slice(0, 10) : "なし"}`,
        `confirmed=${u.confirmed}`,
        `metaName=${u.meta_name ?? "-"}`,
        `prisma=${u.prisma_rows > 0 ? "対応あり" : "❌Prisma行なし"}`,
        `id=${u.id.slice(0, 8)}`,
      ].join("  ")
    )
  }

  // ── 2. Prisma User 全件 + auth 対応 ──
  const prismaUsers = await q(`
    select
      u.id,
      u."supabaseUserId" as sid,
      u.name,
      u.role::text as role,
      u."createdAt" as created,
      (select count(*)::int from auth.users a where a.id::text = u."supabaseUserId") as auth_rows,
      (select count(*)::int from "Performance" p where p."userId" = u.id) as perf,
      (select count(*)::int from "Score" s where s."createdById" = u.id) as scores
    from "User" u
    order by u."createdAt" asc
  `)

  console.log("\n=== Prisma User 全件（", prismaUsers.length, "件） ===")
  for (const u of prismaUsers) {
    console.log(
      [
        `name=${u.name}`,
        `role=${u.role}`,
        `created=${new Date(u.created).toISOString().slice(0, 10)}`,
        `auth=${u.auth_rows > 0 ? "対応あり" : "❌孤児"}`,
        `perf=${u.perf} score=${u.scores}`,
        `sid=${u.sid.slice(0, 8)}`,
      ].join("  ")
    )
  }

  // ── 3. 37演奏の孤児の素性 ──
  console.log("\n=== 注目: 37演奏の孤児アカウントの中身 ===")
  const focusUser = await q(`select id, name, role::text as role, "createdAt" as created from "User" where "supabaseUserId" = '${FOCUS_ORPHAN}'`)
  if (focusUser.length === 0) {
    console.log("該当なし")
  } else {
    const fu = focusUser[0]
    console.log(`Prisma User: name=${fu.name} role=${fu.role} created=${new Date(fu.created).toISOString()}`)
    const scores = await q(`select title, composer, "createdAt" as created from "Score" where "createdById" = '${fu.id}' order by "createdAt" asc`)
    console.log(`  譜面 ${scores.length} 件:`)
    for (const s of scores) console.log(`    - "${s.title}" / ${s.composer ?? "-"} (${new Date(s.created).toISOString().slice(0, 10)})`)
    const perfRange = await q(`select count(*)::int as c, min("uploadedAt") as first, max("uploadedAt") as last from "Performance" where "userId" = '${fu.id}'`)
    const pr = perfRange[0]
    console.log(`  演奏 ${pr.c} 件: ${pr.first ? new Date(pr.first).toISOString().slice(0,10) : "?"} 〜 ${pr.last ? new Date(pr.last).toISOString().slice(0,10) : "?"}`)
  }

  // ── 4. 同名/同一人物らしき auth 垢の探索（tetsuo 系） ──
  console.log("\n=== tetsuo 系 auth 垢（同一人物の現役アカウント特定用） ===")
  const tetsuo = await q(`
    select a.email, a.created_at, a.last_sign_in_at,
      (select count(*)::int from "User" u where u."supabaseUserId" = a.id::text) as prisma_rows
    from auth.users a
    where a.email ilike '%tetsuo%' or a.raw_user_meta_data->>'name' ilike '%komatsu%' or a.raw_user_meta_data->>'name' ilike '%tetsuo%'
    order by a.created_at asc
  `)
  for (const t of tetsuo) {
    console.log(`  email=${t.email}  created=${t.created_at ? new Date(t.created_at).toISOString().slice(0,10):"?"}  lastLogin=${t.last_sign_in_at ? new Date(t.last_sign_in_at).toISOString().slice(0,10):"なし"}  prisma=${t.prisma_rows>0?"対応あり":"行なし"}`)
  }
}

main()
  .catch((e) => {
    console.error("ERROR:", e?.message ?? e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
