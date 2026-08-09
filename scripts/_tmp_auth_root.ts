import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const q = (s: string, ...p: any[]) => prisma.$queryRawUnsafe<any[]>(s, ...p)

async function main() {
  // 1. カラムのデフォルト値 (定義上 '' なのか NULL 許容なのか)
  console.log("=== auth.users email_change 系カラムの定義 ===")
  const defs = await q(`
    SELECT column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='auth' AND table_name='users'
      AND column_name IN ('email_change','email_change_token_new','email_change_token_current',
                          'confirmation_token','recovery_token','email_change_confirm_status')
    ORDER BY column_name`)
  defs.forEach(d => console.log(`  ${d.column_name.padEnd(30)} nullable=${d.is_nullable}  default=${d.column_default ?? "(なし)"}`))

  // 2. 壊れた行の詳細 (メール変更が途中で止まっていないか)
  console.log("\n=== 壊れた行 (tetsuo.komatsuzaki@tmdi.jp) の状態 ===")
  const bad = await q(`
    SELECT email, created_at::date AS created, updated_at::date AS updated,
           email_change_confirm_status AS confirm_status,
           (email_change_token_new IS NULL) AS tok_new_null,
           (email_change IS NULL) AS change_null,
           (email_change_token_current IS NULL) AS tok_cur_null,
           (raw_app_meta_data->>'provider') AS provider,
           encrypted_password IS NOT NULL AS has_pw
    FROM auth.users WHERE email='tetsuo.komatsuzaki@tmdi.jp'`)
  console.log(bad[0])

  // 3. 健全な行と比べる (他16行はどうなっているか)
  console.log("\n=== 全17行の email_change 系 NULL 集計 ===")
  const agg = await q(`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE email_change_token_current IS NULL)::int AS cur_null,
      count(*) FILTER (WHERE email_change_token_new IS NULL)::int AS new_null,
      count(*) FILTER (WHERE email_change IS NULL)::int AS change_null,
      min(created_at)::date AS first_signup
    FROM auth.users`)
  console.log(agg[0])

  // 4. このカラムはいつ足された? = 作成順で見て「古い行だけ NULL」か「新しい行にもある」か
  console.log("\n=== 作成日順 × email_change_token_current が NULL か ===")
  const order = await q(`
    SELECT created_at::date AS created, email,
           (email_change_token_current IS NULL) AS cur_null
    FROM auth.users ORDER BY created_at ASC LIMIT 5`)
  order.forEach(o => console.log(`  ${o.created} ${o.cur_null ? "NULL":"''  "} ${o.email}`))
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
