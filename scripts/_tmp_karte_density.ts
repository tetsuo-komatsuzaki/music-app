// 成長カルテのコールドスタート実態調査 (2026-08-02・読み取りのみ)
// 各ユーザーについて: 録音数 / diagnosis付き録音数 / per_subtask 合算の密度
// (intervalグリッドが埋まるか・所見ルールが発火するか) を確認する。
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true },
  })

  const since30 = new Date(Date.now() - 30 * 864e5)

  for (const u of users) {
    const [perfs, pracs] = await Promise.all([
      prisma.performance.findMany({
        where: { userId: u.id },
        select: { uploadedAt: true, pitchAccuracy: true, analysisSummary: true },
      }),
      prisma.practicePerformance.findMany({
        where: { userId: u.id },
        select: { uploadedAt: true, pitchAccuracy: true, analysisSummary: true },
      }),
    ])
    const all = [...perfs, ...pracs]
    if (all.length === 0) continue

    const recent = all.filter((p) => p.uploadedAt >= since30)
    let withDiag = 0
    const sub = new Map<string, { miss: number; target: number }>()
    for (const p of recent) {
      const d = (p.analysisSummary as { diagnosis?: { per_subtask?: Record<string, { miss: number; target: number }> } } | null)?.diagnosis
      if (d?.per_subtask && Object.keys(d.per_subtask).length > 0) {
        withDiag++
        for (const [sid, v] of Object.entries(d.per_subtask)) {
          if (typeof v?.miss !== "number" || typeof v?.target !== "number") continue
          const e = sub.get(sid) ?? { miss: 0, target: 0 }
          e.miss += v.miss
          e.target += v.target
          sub.set(sid, e)
        }
      }
    }

    // グリッド密度: pitch_interval_* 12セルのうち target>=8 のセル数
    let gridCells = 0
    for (const cross of ["same", "adj", "skip"]) {
      for (const dir of ["up", "down"]) {
        for (const dist of ["step", "leap"]) {
          const e = sub.get(`pitch_interval_${cross}_${dir}_${dist}`)
          if (e && e.target >= 8) gridCells++
        }
      }
    }
    // 奏法行: tech系 target>=6 の行数
    let techRows = 0
    for (const t of ["slur", "staccato", "vibrato", "trill", "tremolo", "pizzicato"]) {
      const a = sub.get(`pitch_tech_${t}`) ?? { miss: 0, target: 0 }
      const b = sub.get(`rhythm_tech_${t}`) ?? { miss: 0, target: 0 }
      if (a.target + b.target >= 6) techRows++
    }
    const dotted = sub.get("rhythm_value_dotted")
    if (dotted && dotted.target >= 6) techRows++

    console.log(
      `${(u.name || u.id).slice(0, 14).padEnd(14)} role=${u.role.padEnd(7)} ` +
      `全録音=${String(all.length).padStart(3)} 30日=${String(recent.length).padStart(3)} ` +
      `diag付=${String(withDiag).padStart(3)} subtask種=${String(sub.size).padStart(3)} ` +
      `グリッド埋=${gridCells}/12 奏法行=${techRows}`,
    )
  }

  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
