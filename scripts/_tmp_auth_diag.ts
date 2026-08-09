import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // GoTrue が listUsers で 500 を返す典型原因 = トークン系カラムが NULL
  // (Go 側は string で scan するため NULL で "converting NULL to string" エラー)
  const cols = [
    "confirmation_token", "recovery_token", "email_change_token_new",
    "email_change", "email_change_token_current", "phone_change",
    "phone_change_token", "reauthentication_token",
  ]
  console.log("=== auth.users のトークン系カラムに NULL があるか ===")
  for (const c of cols) {
    try {
      const r = await prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*)::int AS n FROM auth.users WHERE "${c}" IS NULL`
      )
      const n = r[0].n
      console.log(`  ${c.padEnd(30)} : NULL ${n} 件 ${n > 0 ? "  ← これが原因" : ""}`)
    } catch (e) {
      console.log(`  ${c.padEnd(30)} : (カラム無し or 不可) ${String(e).slice(0,60)}`)
    }
  }

  // メール重複 (これも 500 の原因になりうる)
  const dup = await prisma.$queryRawUnsafe<any[]>(
    `SELECT lower(email) AS e, count(*)::int AS n FROM auth.users
     WHERE email IS NOT NULL GROUP BY lower(email) HAVING count(*) > 1`
  )
  console.log(`\n=== メール重複 ===`)
  console.log(dup.length ? dup.map(d=>`  ${d.e} × ${d.n}`).join("\n") : "  なし")

  // NULL のある行を1件だけ特定 (email で)
  const bad = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id::text, email FROM auth.users
     WHERE confirmation_token IS NULL OR recovery_token IS NULL
        OR email_change_token_new IS NULL OR email_change IS NULL
        OR email_change_token_current IS NULL OR phone_change IS NULL
        OR phone_change_token IS NULL OR reauthentication_token IS NULL`
  )
  console.log(`\n=== NULL を含む行: ${bad.length} 件 ===`)
  bad.forEach(b => console.log(`  ${b.email ?? "(no email)"}  ${b.id}`))
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
