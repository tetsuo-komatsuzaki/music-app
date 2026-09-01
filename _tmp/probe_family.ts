import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { SUBTASK_BY_ID } from "../app/_libs/subtaskCatalog.generated"
const REAL = ["cmmm46xn", "cmlyl3rf", "cmoecf4z", "cmt00qgz", "cmlz5bu3"]
async function main() {
  const rows = await prisma.userSkillSubScore.findMany({
    select: { userId: true, skillSubTaskId: true, matchedCount: true, totalCount: true },
  })
  const fam = new Map<string, { t: number; m: number; users: Set<string>; ids: Set<string> }>()
  for (const r of rows) {
    if (!REAL.some((p) => r.userId.startsWith(p))) continue
    const def = SUBTASK_BY_ID[r.skillSubTaskId]
    if (!def) continue
    const key = `${def.tree}/${def.problem}`
    const e = fam.get(key) ?? { t: 0, m: 0, users: new Set(), ids: new Set() }
    e.t += r.totalCount; e.m += r.matchedCount; e.users.add(r.userId); e.ids.add(r.skillSubTaskId)
    fam.set(key, e)
  }
  console.log("ファミリー別 (実ユーザーのみ) 判定音数 / ミス率 / 保有人数 / ID種類")
  for (const [k, e] of [...fam.entries()].sort((a, b) => b[1].t - a[1].t)) {
    console.log(`  ${k.padEnd(28)} ${String(e.t).padStart(7)}音  ミス${String(Math.round(e.m / e.t * 100)).padStart(3)}%  ${e.users.size}人  ${e.ids.size}種`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
