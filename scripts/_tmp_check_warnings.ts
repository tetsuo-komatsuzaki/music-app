import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true },
  })
  console.log(`v36: pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy}`)
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const json = JSON.parse(await data!.text())
  console.log(`warnings: ${JSON.stringify(json.warnings)}`)
}
main().finally(() => prisma.$disconnect())
