import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const users = await prisma.user.findMany({
    where: { role: "student", deletedAt: null, studentLinks: { none: {} } },
    select: { id: true, supabaseUserId: true, _count: { select: { performances: true } } },
  })
  users.sort((a, b) => b._count.performances - a._count.performances)
  console.log(users.slice(0, 3).map((u) => ({ sb: u.supabaseUserId, perf: u._count.performances })))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
