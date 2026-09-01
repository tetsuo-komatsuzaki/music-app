import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  // email 列を持つ全テーブルを列挙して件数を出す (public スキーマ)
  const cols = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND (column_name ILIKE '%email%' OR table_name ILIKE '%wait%')
    ORDER BY table_name`
  const seen = new Set<string>()
  for (const c of cols) {
    if (seen.has(c.table_name)) continue
    seen.add(c.table_name)
    const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(`SELECT count(*) AS n FROM "${c.table_name}"`)
    console.log(c.table_name, "→", Number(rows[0].n), "件 (該当列:", c.column_name + ")")
  }
  // auth スキーマの登録ユーザー数 (Supabase Auth)
  const auth = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM auth.users`
  console.log("auth.users (アプリ登録ユーザー) →", Number(auth[0].n), "件")
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
