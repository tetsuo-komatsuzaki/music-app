import { config } from "dotenv"
config()

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const storage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // pitchAccuracy が null の Performance を取得
  const performances = await prisma.performance.findMany({
    where: {
      comparisonResultPath: { not: null },
      pitchAccuracy: null,
    },
    select: { id: true, comparisonResultPath: true },
  })

  console.log(`Backfilling ${performances.length} performances...`)

  for (const perf of performances) {
    try {
      const { data } = await storage.storage
        .from("performances")
        .createSignedUrl(perf.comparisonResultPath!, 60)

      if (!data?.signedUrl) continue

      const res = await fetch(data.signedUrl)
      if (!res.ok) continue

      const json = await res.json()
      const results = json.results || (Array.isArray(json) ? json : null)
      if (!results) continue

      const evaluated = results.filter(
        (r: any) => r.evaluation_status === "evaluated" || r.evaluation_status === "pitch_only"
      )
      const pitchOk = evaluated.filter((r: any) => r.pitch_ok === true)
      const timingEvaluated = results.filter((r: any) => r.evaluation_status === "evaluated")
      const timingOk = timingEvaluated.filter((r: any) => r.start_ok === true)

      const pitchAccuracy = evaluated.length > 0
        ? Math.round((pitchOk.length / evaluated.length) * 1000) / 10
        : null
      const timingAccuracy = timingEvaluated.length > 0
        ? Math.round((timingOk.length / timingEvaluated.length) * 1000) / 10
        : null
      const overallScore = pitchAccuracy != null && timingAccuracy != null
        ? Math.round((pitchAccuracy * 0.6 + timingAccuracy * 0.4) * 10) / 10
        : pitchAccuracy

      await prisma.performance.update({
        where: { id: perf.id },
        data: {
          pitchAccuracy,
          timingAccuracy,
          overallScore,
          evaluatedNotes: evaluated.length,
          analysisSummary: {},
        },
      })

      console.log(`  ${perf.id}: pitch=${pitchAccuracy}% timing=${timingAccuracy}% overall=${overallScore}%`)
    } catch (e: any) {
      console.error(`  ${perf.id}: ERROR ${e.message}`)
    }
  }

  // PracticePerformance も同様に処理
  const practicePerfs = await prisma.practicePerformance.findMany({
    where: {
      comparisonResultPath: { not: null },
      pitchAccuracy: null,
    },
    select: { id: true, comparisonResultPath: true },
  })

  console.log(`Backfilling ${practicePerfs.length} practice performances...`)

  for (const perf of practicePerfs) {
    try {
      const { data } = await storage.storage
        .from("performances")
        .createSignedUrl(perf.comparisonResultPath!, 60)

      if (!data?.signedUrl) continue

      const res = await fetch(data.signedUrl)
      if (!res.ok) continue

      const json = await res.json()
      const results = json.results || (Array.isArray(json) ? json : null)
      if (!results) continue

      const evaluated = results.filter(
        (r: any) => r.evaluation_status === "evaluated" || r.evaluation_status === "pitch_only"
      )
      const pitchOk = evaluated.filter((r: any) => r.pitch_ok === true)
      const timingEvaluated = results.filter((r: any) => r.evaluation_status === "evaluated")
      const timingOk = timingEvaluated.filter((r: any) => r.start_ok === true)

      const pitchAccuracy = evaluated.length > 0
        ? Math.round((pitchOk.length / evaluated.length) * 1000) / 10
        : null
      const timingAccuracy = timingEvaluated.length > 0
        ? Math.round((timingOk.length / timingEvaluated.length) * 1000) / 10
        : null
      const overallScore = pitchAccuracy != null && timingAccuracy != null
        ? Math.round((pitchAccuracy * 0.6 + timingAccuracy * 0.4) * 10) / 10
        : pitchAccuracy

      await prisma.practicePerformance.update({
        where: { id: perf.id },
        data: {
          pitchAccuracy,
          timingAccuracy,
          overallScore,
          evaluatedNotes: evaluated.length,
          analysisSummary: {},
        },
      })

      console.log(`  ${perf.id}: pitch=${pitchAccuracy}% timing=${timingAccuracy}% overall=${overallScore}%`)
    } catch (e: any) {
      console.error(`  ${perf.id}: ERROR ${e.message}`)
    }
  }

  console.log("Done.")
  await prisma.$disconnect()
}

main()
