import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import { extractScoreSymbols } from "@/app/_libs/scoreSymbols"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const id = "cmq3x0qed000304l7noqf4wmi"
  const sc = await prisma.score.findUnique({
    where: { id },
    select: { id: true, title: true, createdById: true, analysisStatus: true, buildStatus: true,
      deletedAt: true, generatedXmlPath: true, positions: true },
  })
  console.log("=== Score DB ===")
  console.log(JSON.stringify(sc, null, 1))
  if (!sc) { console.log("スコアが存在しない"); return }

  // analysis.json を取得して extractScoreSymbols が壊れないか
  const path = `${sc.createdById}/${sc.id}/analysis.json`
  const { data, error } = await sb.storage.from("musicxml").download(path)
  if (error) { console.log("analysis.json ダウンロード失敗:", error.message); }
  else {
    const json = JSON.parse(await data.text())
    console.log("\n=== analysis.json ===")
    console.log("notes:", (json.notes?.length ?? 0), "keys:", Object.keys(json))
    try {
      const { list, byNote } = extractScoreSymbols(json)
      console.log("extractScoreSymbols OK: 記号", list.length, "種 / byNote", byNote.size)
    } catch (e) {
      console.log("★ extractScoreSymbols が例外:", e)
    }
  }
}
main().catch(e => { console.error("★ 診断中に例外:", e); process.exitCode = 1 }).finally(() => prisma.$disconnect())
