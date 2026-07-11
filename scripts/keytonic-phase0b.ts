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

async function main() {
  // keyTonic null の Score について analysis.json の key を確認
  const nulls = await prisma.$queryRawUnsafe<any[]>(`
    select s.id, s.title, s."originalXmlPath", s."analysisStatus"::text as status, s."createdAt"
    from "Score" s
    where s."deletedAt" is null and (s."keyTonic" is null or s."keyTonic"='')
    order by s."createdAt" asc
  `)
  for (const s of nulls) {
    // originalXmlPath: {authUid}/{scoreId}.ext → analysis.json は {authUid}/{scoreId}/analysis.json
    const m = String(s.originalXmlPath ?? "").match(/^(.+)\/([^/]+)\.[^.]+$/)
    if (!m) { console.log(`${s.title}: xmlPath形式不明 ${s.originalXmlPath}`); continue }
    const path = `${m[1]}/${s.id}/analysis.json`
    const { data, error } = await supa.storage.from("musicxml").download(path)
    if (error || !data) {
      console.log(`${s.title} (${s.status}) | analysis.json 取得失敗: ${path} | ${error?.message}`)
      continue
    }
    try {
      const j = JSON.parse(await data.text())
      console.log(
        `${s.title} (${s.status}) | analysis.json あり | key=${JSON.stringify(j.key ?? "(keyフィールドなし)")} | bpm=${j.bpm} | notes=${(j.notes ?? []).length}`
      )
    } catch (e: any) {
      console.log(`${s.title} | JSON parse失敗: ${e.message}`)
    }
  }
}
main().catch((e) => console.error("ERR", e?.message ?? e)).finally(() => prisma.$disconnect())
