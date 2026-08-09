import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const q = (s: string, ...p: any[]) => prisma.$queryRawUnsafe<any[]>(s, ...p)

async function main() {
  // ダッシュボードが読む「本来 NOT NULL であるべき」カラムに NULL が無いか
  console.log("=== auth.users: 真偽値/日時など NULL 集計 ===")
  const cols = ["is_sso_user","is_anonymous","email_confirmed_at","confirmed_at",
                "aud","role","instance_id","email_change_confirm_status"]
  for (const c of cols) {
    try {
      const r = await q(`SELECT count(*)::int AS n FROM auth.users WHERE "${c}" IS NULL`)
      console.log(`  ${c.padEnd(28)} : NULL ${r[0].n} 件 ${r[0].n>0?"  ←":""}`)
    } catch(e){ console.log(`  ${c.padEnd(28)} : (無し) ${String(e).slice(0,50)}`) }
  }

  // auth.identities の健全性 (ダッシュボードは identities も join する)
  console.log("\n=== auth.identities ===")
  try {
    const idc = await q(`SELECT count(*)::int AS n FROM auth.identities`)
    console.log(`  identities 件数: ${idc[0].n}`)
    const idNull = await q(`
      SELECT count(*)::int AS n FROM auth.identities
      WHERE provider_id IS NULL OR provider IS NULL OR identity_data IS NULL OR user_id IS NULL`)
    console.log(`  必須カラムが NULL の identities: ${idNull[0].n} 件`)
    // identities に居るが auth.users に居ない(逆参照切れ)
    const orphanId = await q(`
      SELECT i.provider, u.email FROM auth.identities i
      LEFT JOIN auth.users u ON u.id = i.user_id WHERE u.id IS NULL`)
    console.log(`  親ユーザーが居ない identities: ${orphanId.length} 件`)
  } catch(e){ console.log("  identities 調査失敗:", String(e).slice(0,80)) }

  // users に居るが identities が無い (ダッシュボードで "provider" 表示時に問題になりうる)
  console.log("\n=== users に identities が無い行 ===")
  const noId = await q(`
    SELECT u.email, u.created_at::date AS created FROM auth.users u
    LEFT JOIN auth.identities i ON i.user_id = u.id WHERE i.id IS NULL ORDER BY u.created_at`)
  console.log(`  ${noId.length} 件`)
  noId.forEach(n => console.log(`    ${n.created} ${n.email}`))

  // email が NULL や空の行 (これも一覧描画で落ちる)
  const badEmail = await q(`SELECT count(*)::int AS n FROM auth.users WHERE email IS NULL OR email=''`)
  console.log(`\nemail が空/NULL の行: ${badEmail[0].n} 件`)
}
main().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
