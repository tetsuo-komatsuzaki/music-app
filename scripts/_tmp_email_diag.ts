import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const q = (s: string, ...p: any[]) => prisma.$queryRawUnsafe<any[]>(s, ...p)

async function main() {
  // 1. #11 の認証状態を詳しく
  console.log("=== #11 unitunit9293@yahoo.co.jp の認証状態 ===")
  const u = await q(`
    SELECT id::text, email,
      created_at, confirmation_sent_at, email_confirmed_at, confirmed_at,
      last_sign_in_at, recovery_sent_at,
      (confirmation_token = '' ) AS token_empty,
      confirmation_token,
      raw_app_meta_data->>'provider' AS provider,
      banned_until
    FROM auth.users WHERE email='unitunit9293@yahoo.co.jp'`)
  console.log(JSON.stringify(u[0], (k,v)=> typeof v==='bigint'? v.toString(): v, 1))

  // 2. 全ユーザーの「確認済みか / 確認メール送信されたか」パターン
  console.log("\n=== 全17人: メール確認の状況 (ドメイン別に効く) ===")
  const all = await q(`
    SELECT email,
      split_part(email,'@',2) AS domain,
      (email_confirmed_at IS NOT NULL) AS confirmed,
      (confirmation_sent_at IS NOT NULL) AS conf_sent,
      created_at::date AS created
    FROM auth.users ORDER BY created_at`)
  all.forEach(r=>console.log(`  ${r.confirmed?"確認済":"未確認"} | 送信${r.conf_sent?"あり":"なし"} | ${r.created} | ${r.domain.padEnd(16)} | ${r.email}`))

  // 3. 未確認ユーザーだけ集計 (メール不達の疑い)
  const un = await q(`
    SELECT split_part(email,'@',2) AS domain, count(*)::int AS n
    FROM auth.users WHERE email_confirmed_at IS NULL GROUP BY 1 ORDER BY 2 DESC`)
  console.log("\n=== 未確認ユーザーのドメイン別 ===")
  console.log(un.length ? un.map(x=>`  ${x.domain} × ${x.n}`).join("\n") : "  なし(全員確認済み)")
}
main().catch((e)=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect())
