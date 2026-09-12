// 診断: 実データに奏法品質の判定を当ててみる (2026-09-12)。読み取り専用。
import { config } from "dotenv"
config()
async function main() {
  const { prismaSource } = await import("../app/_libs/noteStore")
  const { tallyAll } = await import("../app/_libs/techniqueQuality")
  const { prisma } = await import("../app/_libs/prisma")
  const users = await prisma.user.findMany({ select: { id: true, name: true } })
  for (const u of users) {
    const rows = await prismaSource.fetchDetail({ userId: u.id }).catch(() => [])
    if (rows.length === 0) continue
    const t = tallyAll(rows)
    const parts = [...t.entries()]
      .filter(([, v]) => v.judged > 0 || v.unmeasured > 0)
      .map(([k, v]) => `${k}: 判定${v.judged} 合格${v.ok} 測れず${v.unmeasured} ${v.pct != null ? v.pct + "%" : "-"}`)
    console.log(`${u.id.slice(0, 12)} ${(u.name ?? "").slice(0, 8).padEnd(9)} 音${String(rows.length).padStart(5)}  ${parts.length ? parts.join(" / ") : "対象の奏法なし"}`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
