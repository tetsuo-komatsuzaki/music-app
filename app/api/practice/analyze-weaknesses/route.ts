// app/api/practice/analyze-weaknesses/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function POST(_request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  // 直近20件の Performance の comparison_result を取得
  const performances = await prisma.performance.findMany({
    where: { userId: dbUserId, comparisonResultPath: { not: null } },
    orderBy: { uploadedAt: "desc" },
    take: 20,
    include: { score: true },
  })

  // PracticePerformance もまとめて取得
  const practicePerformances = await prisma.practicePerformance.findMany({
    where: { userId: dbUserId, comparisonResultPath: { not: null } },
    orderBy: { uploadedAt: "desc" },
    take: 20,
    include: { practiceItem: true },
  })

  type NoteResult = {
    pitch_ok: boolean | null
    start_ok: boolean | null
    expected_pitch_hz: number
    evaluation_status?: string
  }

  const allResults: { notes: NoteResult[]; keyTonic: string | null; keyMode: string | null }[] = []

  // Performance の comparison_result を取得
  for (const perf of performances) {
    if (!perf.comparisonResultPath) continue
    try {
      const { data } = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(perf.comparisonResultPath, 30)
      if (!data?.signedUrl) continue
      const res = await fetch(data.signedUrl)
      if (!res.ok) continue
      const json = await res.json()
      const notes = json.results || json
      if (Array.isArray(notes)) {
        allResults.push({
          notes,
          keyTonic: perf.score.keyTonic,
          keyMode: perf.score.keyMode,
        })
      }
    } catch (_e) { continue }
  }

  // PracticePerformance の comparison_result を取得
  for (const pp of practicePerformances) {
    if (!pp.comparisonResultPath) continue
    try {
      const { data } = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(pp.comparisonResultPath, 30)
      if (!data?.signedUrl) continue
      const res = await fetch(data.signedUrl)
      if (!res.ok) continue
      const json = await res.json()
      const notes = json.results || json
      if (Array.isArray(notes)) {
        allResults.push({
          notes,
          keyTonic: pp.practiceItem.keyTonic,
          keyMode: pp.practiceItem.keyMode,
        })
      }
    } catch (_e) { continue }
  }

  if (allResults.length === 0) {
    return NextResponse.json({ weaknesses: [], message: "No comparison data found" })
  }

  const weaknesses: { type: string; key: string; severity: number; sampleCount: number }[] = []

  // --- 1. 調ごとのピッチ精度 ---
  const keyStats: Record<string, { ok: number; total: number }> = {}
  for (const { notes, keyTonic, keyMode } of allResults) {
    if (!keyTonic) continue
    const key = `${keyTonic}_${keyMode || "major"}`
    if (!keyStats[key]) keyStats[key] = { ok: 0, total: 0 }
    for (const n of notes) {
      if (n.evaluation_status === "not_detected") continue
      if (n.pitch_ok !== null && n.pitch_ok !== undefined) {
        keyStats[key].total++
        if (n.pitch_ok === true) keyStats[key].ok++
      }
    }
  }
  for (const [key, stat] of Object.entries(keyStats)) {
    if (stat.total >= 10) {
      const errorRate = 1 - stat.ok / stat.total
      if (errorRate > 0.2) {
        weaknesses.push({ type: "key_area", key, severity: errorRate, sampleCount: stat.total })
      }
    }
  }

  // --- 2. 音域ごとのピッチ精度 ---
  const rangeStats: Record<string, { ok: number; total: number }> = {
    low: { ok: 0, total: 0 },
    mid: { ok: 0, total: 0 },
    high: { ok: 0, total: 0 },
    very_high: { ok: 0, total: 0 },
  }
  for (const { notes } of allResults) {
    for (const n of notes) {
      if (!n.expected_pitch_hz || n.pitch_ok === null) continue
      const hz = n.expected_pitch_hz
      const range = hz < 294 ? "low" : hz < 440 ? "mid" : hz < 659 ? "high" : "very_high"
      rangeStats[range].total++
      if (n.pitch_ok === true) rangeStats[range].ok++
    }
  }
  for (const [range, stat] of Object.entries(rangeStats)) {
    if (stat.total >= 10) {
      const errorRate = 1 - stat.ok / stat.total
      if (errorRate > 0.3) {
        weaknesses.push({ type: "pitch_range", key: range, severity: errorRate, sampleCount: stat.total })
      }
    }
  }

  // --- 3. タイミング精度 ---
  let timingOk = 0, timingTotal = 0
  for (const { notes } of allResults) {
    for (const n of notes) {
      if (n.start_ok !== null && n.start_ok !== undefined) {
        timingTotal++
        if (n.start_ok === true) timingOk++
      }
    }
  }
  if (timingTotal >= 20) {
    const errorRate = 1 - timingOk / timingTotal
    if (errorRate > 0.3) {
      weaknesses.push({ type: "timing", key: "overall", severity: errorRate, sampleCount: timingTotal })
    }
  }

  // --- DBに保存（upsert） ---
  for (const w of weaknesses) {
    await prisma.userWeakness.upsert({
      where: { userId_weaknessType_weaknessKey: { userId: dbUserId, weaknessType: w.type, weaknessKey: w.key } },
      update: { severity: w.severity, sampleCount: w.sampleCount, lastUpdated: new Date() },
      create: { userId: dbUserId, weaknessType: w.type, weaknessKey: w.key, severity: w.severity, sampleCount: w.sampleCount },
    })
  }

  return NextResponse.json({ weaknesses, analyzed: allResults.length })
}
