import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.waitlistEntry.findMany({ select: { email: true, createdAt: true } })
  const uniq = new Set(rows.map((r) => r.email.trim().toLowerCase()))
  const latest = rows.map((r) => r.createdAt).sort((a, b) => b.getTime() - a.getTime())[0]
  console.log(JSON.stringify({ total: rows.length, unique: uniq.size, latest }, null, 1))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
