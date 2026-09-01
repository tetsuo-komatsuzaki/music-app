import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const rows = await prisma.performance.findMany({
    where: { pitchAccuracy: { not: null }, rangeFromNote: null },
    orderBy: { uploadedAt: "desc" }, take: 40,
    select: { id: true, analysisSummary: true },
  })
  let ns = 0, diag = 0, notes = 0, trans = 0, sub = 0
  let sampleNote: unknown = null, sampleSub: unknown = null
  for (const r of rows) {
    const a = r.analysisSummary as any
    if (a?.noteStats) { ns++
      if (a.noteStats.notes) { notes++; if (!sampleNote) sampleNote = Object.entries(a.noteStats.notes).slice(0, 2) }
      if (a.noteStats.transitions) trans++
    }
    if (a?.diagnosis?.per_subtask) { diag++; sub += Object.keys(a.diagnosis.per_subtask).length
      if (!sampleSub) sampleSub = Object.entries(a.diagnosis.per_subtask).slice(0, 3) }
  }
  console.log(`直近40件: noteStats ${ns} / notes ${notes} / transitions ${trans} / diagnosis ${diag} (subtask平均${diag ? Math.round(sub / diag) : 0}種)`)
  console.log("notes サンプル:", JSON.stringify(sampleNote))
  console.log("per_subtask サンプル:", JSON.stringify(sampleSub))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
