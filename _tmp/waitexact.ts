import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.$queryRaw<{ email: string; createdAt: Date }[]>`
    SELECT email, "createdAt" FROM "WaitlistEntry" ORDER BY "createdAt" ASC`
  const total = rows.length
  const emails = rows.map((r) => r.email.trim().toLowerCase())
  const distinct = new Set(emails).size
  const dupes = emails.filter((e, i) => emails.indexOf(e) !== i)
  const own = emails.filter((e) => e.includes("tetsuo") || e.includes("9293"))
  console.log("総行数:", total)
  console.log("重複除外のユニークメール:", distinct)
  if (dupes.length) console.log("重複:", [...new Set(dupes)].join(", "))
  if (own.length) console.log("本人らしき登録:", own.join(", "))
  console.log("最古:", rows[0]?.createdAt.toISOString(), "/ 最新:", rows[total - 1]?.createdAt.toISOString())
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
