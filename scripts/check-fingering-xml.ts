import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const BUCKET = "musicxml"

async function main() {
  // カテゴリごとに最大4件サンプル
  const items = await prisma.$queryRawUnsafe<any[]>(`
    select distinct on (category, id) id, category::text as category, title, "originalXmlPath"
    from (
      select *, row_number() over (partition by category order by id) as rn
      from "PracticeItem"
    ) t
    where rn <= 4
    order by category, id
  `)

  const perCat: Record<string, { checked: number; withFinger: number; fingerCounts: number[]; noteCounts: number[] }> = {}

  for (const it of items) {
    const { data, error } = await supa.storage.from(BUCKET).download(it.originalXmlPath)
    if (error || !data) {
      console.log(`  [DL失敗] ${it.category} ${it.title}: ${error?.message}`)
      continue
    }
    const xml = await data.text()
    const fingerCount = (xml.match(/<fingering\b/g) || []).length
    const noteCount = (xml.match(/<note\b/g) || []).length
    perCat[it.category] ??= { checked: 0, withFinger: 0, fingerCounts: [], noteCounts: [] }
    const c = perCat[it.category]
    c.checked++
    if (fingerCount > 0) c.withFinger++
    c.fingerCounts.push(fingerCount)
    c.noteCounts.push(noteCount)
  }

  console.log("category | 確認数 | fingering有 | fingering数(サンプル) | note数(サンプル)")
  for (const [cat, c] of Object.entries(perCat)) {
    console.log(
      `${cat} | ${c.checked} | ${c.withFinger}/${c.checked} | [${c.fingerCounts.join(",")}] | [${c.noteCounts.join(",")}]`
    )
  }
}

main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
