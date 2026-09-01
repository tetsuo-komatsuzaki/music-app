import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { createClient } from "@supabase/supabase-js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const items = await prisma.practiceItem.findMany({
    where: { partId: { not: null } },
    select: { id: true, title: true, originalXmlPath: true },
  })
  console.log("part items total:", items.length)
  const byOrig = new Map<string, { id: string; title: string }[]>()
  for (const it of items) {
    const arr = byOrig.get(it.originalXmlPath) ?? []
    arr.push({ id: it.id, title: it.title })
    byOrig.set(it.originalXmlPath, arr)
  }
  console.log("unique originals:", byOrig.size)
  const affected: string[] = []
  for (const [path, arr] of byOrig) {
    const { data, error } = await supa.storage.from("musicxml").download(path)
    if (error) { console.log("DLERR", path, error.message); continue }
    const txt = Buffer.from(await data.arrayBuffer()).toString("utf8")
    const hasRepeat = txt.includes('<repeat direction=')
    if (hasRepeat) {
      console.log("REPEAT:", arr.map(a => a.title).join(" / "))
      affected.push(...arr.map(a => a.id))
    }
  }
  console.log("affected item ids:", JSON.stringify(affected))
  await prisma.$disconnect()
}
main()
