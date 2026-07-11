/**
 * keyTonic backfill（案A・2026-07-06 Tetsuo承認済）
 * keyTonic が null の Score について、解析成果物 analysis.json（{createdById}/{scoreId}/analysis.json）
 * から key を読み、normalize（music21 'B-' → DB 'Bb'）して Score.keyTonic/keyMode を UPDATE する。
 * 1回きりの補修スクリプト。analysis.json が無い/keyが無い曲はスキップして報告のみ。
 *
 * 実行: npx tsx scripts/keytonic-backfill.ts          … dry-run（書き込みなし）
 *       npx tsx scripts/keytonic-backfill.ts --apply  … 実書き込み
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const APPLY = process.argv.includes("--apply")
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// analyze_musicxml.py の normalize_tonic と同義（music21 'B-' → 'Bb'）
function normalizeTonic(t: string): string {
  return t.replace(/-/g, "b")
}

async function main() {
  console.log(`mode: ${APPLY ? "APPLY(書き込み)" : "DRY-RUN(確認のみ)"}`)
  const nulls = await prisma.$queryRawUnsafe<any[]>(`
    select s.id, s.title, s."createdById", s."analysisStatus"::text as status
    from "Score" s
    where s."deletedAt" is null and (s."keyTonic" is null or s."keyTonic"='')
    order by s."createdAt" asc
  `)
  console.log(`対象: ${nulls.length}件`)

  for (const s of nulls) {
    const path = `${s.createdById}/${s.id}/analysis.json`
    const { data, error } = await supa.storage.from("musicxml").download(path)
    if (error || !data) {
      console.log(`SKIP  ${s.title} (${s.status}) | analysis.json なし: ${path}`)
      continue
    }
    let key: any
    try {
      key = JSON.parse(await data.text()).key
    } catch {
      console.log(`SKIP  ${s.title} | JSON parse 失敗`)
      continue
    }
    if (!key?.tonic || !key?.mode) {
      console.log(`SKIP  ${s.title} | key フィールドなし`)
      continue
    }
    const tonic = normalizeTonic(String(key.tonic))
    const mode = String(key.mode)
    if (APPLY) {
      await prisma.$executeRawUnsafe(
        `update "Score" set "keyTonic"=$1, "keyMode"=$2 where id=$3`,
        tonic, mode, s.id
      )
      console.log(`OK    ${s.title} (${s.status}) | ${key.tonic} ${mode} -> DB書込 ${tonic} ${mode}`)
    } else {
      console.log(`PLAN  ${s.title} (${s.status}) | ${key.tonic} ${mode} -> 書込予定 ${tonic} ${mode}`)
    }
  }

  // 事後検証
  const after = await prisma.$queryRawUnsafe<any[]>(`
    select count(*)::int as remaining from "Score"
    where "deletedAt" is null and ("keyTonic" is null or "keyTonic"='')
  `)
  console.log(`\nkeyTonic null 残: ${after[0].remaining}件`)
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
