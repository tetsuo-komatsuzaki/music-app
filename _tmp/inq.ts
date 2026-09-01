import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const fb = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "Feedback" ORDER BY "createdAt" DESC LIMIT 5`
  console.log("── Feedback ──")
  for (const r of fb) console.log(JSON.stringify(r, (k, v) => typeof v === "string" && v.length > 200 ? v.slice(0, 200) + "…" : v))
  const si = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "SupportInquiry" ORDER BY "createdAt" DESC LIMIT 5`
  console.log("── SupportInquiry ──")
  for (const r of si) console.log(JSON.stringify(r, (k, v) => typeof v === "string" && v.length > 200 ? v.slice(0, 200) + "…" : v))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
