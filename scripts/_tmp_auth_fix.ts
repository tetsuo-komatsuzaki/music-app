import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const q = (s: string, ...p: any[]) => prisma.$queryRawUnsafe<any[]>(s, ...p)
const TARGET = "85555ce4-6822-4efb-8af6-c2a8eda145f0"

async function main() {
  // 1. 実行前スナップショット (念のため全カラムの現状を保存)
  const before = await q(
    `SELECT id::text, email, email_change, email_change_token_new, email_change_token_current, updated_at
     FROM auth.users WHERE id = $1`, TARGET)
  console.log("=== 実行前 ===")
  console.log(JSON.stringify(before[0], null, 1))

  // 2. 1行だけ UPDATE (NULL のものだけ '' に戻す。既に '' の値は触らない)
  const affected = await prisma.$executeRawUnsafe(
    `UPDATE auth.users
     SET email_change               = COALESCE(email_change, ''),
         email_change_token_new     = COALESCE(email_change_token_new, ''),
         email_change_token_current = COALESCE(email_change_token_current, '')
     WHERE id = $1
       AND (email_change IS NULL OR email_change_token_new IS NULL OR email_change_token_current IS NULL)`,
    TARGET)
  console.log(`\n=== UPDATE 実行: ${affected} 行 ===`)

  // 3. 実行後スナップショット
  const after = await q(
    `SELECT email, email_change, email_change_token_new, email_change_token_current FROM auth.users WHERE id = $1`, TARGET)
  console.log("=== 実行後 ===")
  console.log(JSON.stringify(after[0], null, 1))

  // 4. 全17行に NULL が残っていないか最終確認
  const remain = await q(
    `SELECT count(*)::int AS n FROM auth.users
     WHERE email_change IS NULL OR email_change_token_new IS NULL OR email_change_token_current IS NULL
        OR confirmation_token IS NULL OR recovery_token IS NULL OR phone_change IS NULL
        OR phone_change_token IS NULL OR reauthentication_token IS NULL`)
  console.log(`\n=== 残る NULL 行: ${remain[0].n} 件 ===`)

  // 5. GoTrue の listUsers が通るか (本丸の検証)
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) {
    console.log("=== listUsers: まだエラー ===")
    console.log("  ", error.message)
  } else {
    console.log(`=== listUsers: 成功! ${data.users.length} 人 取得できた ===`)
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
