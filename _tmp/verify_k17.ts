import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { createClient } from "@supabase/supabase-js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function main() {
  const g = await prisma.materialGroup.findFirst({ where: { title: { contains: "No.17" }, category: "etude" }, select: { parts: true } })
  console.log("parts:", JSON.stringify(g?.parts))
  for (const id of ["cmtd6bn82000004l78ld13fiv", "cmtd6bnp2000104l7sq6c6swp", "cmtd6bo2c000204l7x339liyl"]) {
    const { data } = await supa.storage.from("musicxml").download(`practice/${id}/build_score.musicxml`)
    const txt = Buffer.from(await data!.arrayBuffer()).toString("utf8")
    const n = (txt.match(/<measure /g) ?? []).length
    console.log(id, "measures:", n)
  }
  await prisma.$disconnect()
}
main()
