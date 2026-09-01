import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
function walk(o: any, prefix = "", depth = 0, out = new Set<string>()) {
  if (depth > 2 || o == null || typeof o !== "object") return out
  if (Array.isArray(o)) { out.add(prefix + "[]"); if (o[0]) walk(o[0], prefix + "[]", depth + 1, out); return out }
  for (const k of Object.keys(o)) {
    const p = prefix ? `${prefix}.${k}` : k
    const v = o[k]
    if (v != null && typeof v === "object") { out.add(p); walk(v, p, depth + 1, out) }
    else out.add(`${p} = ${JSON.stringify(v)?.slice(0, 40)}`)
  }
  return out
}
async function main() {
  const p = await prisma.performance.findFirst({
    where: { analysisSummary: { not: undefined }, pitchAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" },
    select: { analysisSummary: true, uploadedAt: true },
  })
  const a = p?.analysisSummary as any
  console.log("== analysisSummary トップ階層 ==")
  console.log(Object.keys(a ?? {}).join(", "))
  const keys = [...walk(a)].filter((k) => !k.startsWith("noteStats.notes.") && !k.startsWith("diagnosis.per_subtask."))
  console.log("\n== 構造 ==")
  console.log(keys.slice(0, 60).join("\n"))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
