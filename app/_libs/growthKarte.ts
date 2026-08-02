// 成長カルテの集計 (MVP・2026-08-02)。
// 演奏記録を「意味のある知見」に変換する: 実態(量と内訳) / 安定マップ / 所見(相関) / 物語。
// すべて既存データ (Performance/PracticePerformance の analysisSummary.diagnosis
// per_subtask {miss,target}・達成/提出/添削/所見) から生成。新テーブル不要。
import { prisma } from "./prisma"
import { formatKey } from "./musicNotation"
import { categoryLabel } from "./practiceConstants"
import { OBSERVATION_TAG_BY_ID } from "./observationCatalog"
import type { DiagnosisJson } from "./weaknessRecommendation"

export type KartePeriod = "7d" | "30d" | "all"

export interface KeyRow {
  label: string
  count: number
  avgPitch: number | null
}

export interface GridCell {
  cross: "same" | "adj" | "skip"
  dir: "up" | "down"
  dist: "step" | "leap"
  miss: number
  target: number
}

export interface KarteInsight {
  tone: "warn" | "good"
  title: string
  evidence: string
  action?: { label: string; href: string }
}

export interface KarteEvent {
  at: number
  date: string
  kind: "achieve" | "master" | "submit" | "feedback" | "observation" | "celebration"
  text: string
}

export interface KarteData {
  period: KartePeriod
  // 1. 実態
  practiceDays: number
  recordingCount: number
  categoryShare: { label: string; pct: number }[]
  keyRows: KeyRow[]
  unusedKeys: string[]
  dayCounts: Record<string, number> // "YYYY-MM-DD"(JST) -> 録音回数 (全期間・カレンダー用)
  streak: number
  // 2. 安定マップ
  grid: GridCell[]
  techRows: { label: string; miss: number; target: number }[]
  balance: { pitchAvg: number | null; timingAvg: number | null; pitchDelta: number | null; timingDelta: number | null }
  // 3. 所見
  insights: KarteInsight[]
  // 4. 物語
  events: KarteEvent[]
}

const JST_MS = 9 * 3600_000
const jstDate = (d: Date) => new Date(d.getTime() + JST_MS).toISOString().slice(0, 10)
const fmtJp = (d: Date) => d.toLocaleDateString("ja-JP")
const round = (n: number) => Math.round(n)

function periodSince(period: KartePeriod): Date {
  if (period === "7d") return new Date(Date.now() - 7 * 864e5)
  if (period === "30d") return new Date(Date.now() - 30 * 864e5)
  return new Date(0)
}

/** userId は内部ID (User.id)。supabaseUserId は練習リンク用 */
export async function buildKarteData(userId: string, supabaseUserId: string, period: KartePeriod): Promise<KarteData> {
  const since = periodSince(period)

  const [perfs, pracs, allPerfDates, allPracDates, achievements] = await Promise.all([
    prisma.performance.findMany({
      where: { userId, uploadedAt: { gte: since } },
      orderBy: { uploadedAt: "asc" },
      select: {
        uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true,
        score: { select: { keyTonic: true, keyMode: true } },
      },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, uploadedAt: { gte: since } },
      orderBy: { uploadedAt: "asc" },
      select: {
        uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true,
        practiceItem: { select: { category: true, keyTonic: true, keyMode: true } },
      },
    }),
    prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true } }),
    prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true } }),
    prisma.userScoreAchievement.findMany({
      where: { userId },
      orderBy: { achievedAt: "desc" },
      take: 30,
      select: { achievedAt: true, masteredAt: true, score: { select: { title: true } } },
    }),
  ])

  // ── カレンダー/連続記録 (全期間・録音した日ベース。旧「3つルール」は廃止) ──
  const dayCounts: Record<string, number> = {}
  for (const r of [...allPerfDates, ...allPracDates]) {
    const k = jstDate(r.uploadedAt)
    dayCounts[k] = (dayCounts[k] ?? 0) + 1
  }
  let streak = 0
  {
    const today = jstDate(new Date())
    let cursor = new Date()
    if (!dayCounts[today]) cursor = new Date(cursor.getTime() - 864e5) // 今日まだ弾いてなくても昨日から数える
    while (dayCounts[jstDate(cursor)]) {
      streak++
      cursor = new Date(cursor.getTime() - 864e5)
    }
  }

  // ── 1. 実態 ──
  const daySet = new Set<string>()
  for (const p of perfs) daySet.add(jstDate(p.uploadedAt))
  for (const p of pracs) daySet.add(jstDate(p.uploadedAt))
  const recordingCount = perfs.length + pracs.length

  const catCount = new Map<string, number>()
  catCount.set("曲", perfs.length)
  for (const p of pracs) {
    const l = p.practiceItem?.category ? categoryLabel(p.practiceItem.category) : "基礎練"
    catCount.set(l, (catCount.get(l) ?? 0) + 1)
  }
  const categoryShare = [...catCount.entries()]
    .filter(([, c]) => c > 0)
    .map(([label, c]) => ({ label, pct: recordingCount ? Math.round((c / recordingCount) * 100) : 0 }))
    .sort((a, b) => b.pct - a.pct)

  // 調ごと: 回数 + 音程平均 (曲・教材の両方)
  const keyAgg = new Map<string, { count: number; pitchSum: number; pitchN: number }>()
  const addKey = (tonic: string | null | undefined, mode: string | null | undefined, pitch: number | null) => {
    if (!tonic) return
    const label = formatKey(tonic, mode)
    const e = keyAgg.get(label) ?? { count: 0, pitchSum: 0, pitchN: 0 }
    e.count++
    if (pitch != null) { e.pitchSum += pitch; e.pitchN++ }
    keyAgg.set(label, e)
  }
  for (const p of perfs) addKey(p.score?.keyTonic, p.score?.keyMode, p.pitchAccuracy)
  for (const p of pracs) addKey(p.practiceItem?.keyTonic, p.practiceItem?.keyMode, p.pitchAccuracy)
  const keyRows: KeyRow[] = [...keyAgg.entries()]
    .map(([label, e]) => ({ label, count: e.count, avgPitch: e.pitchN ? round(e.pitchSum / e.pitchN) : null }))
    .sort((a, b) => b.count - a.count)
  const STANDARD_KEYS = ["ハ長調", "ト長調", "ニ長調", "イ長調", "ヘ長調", "イ短調", "ホ短調"]
  const unusedKeys = STANDARD_KEYS.filter((k) => !keyAgg.has(k)).slice(0, 4)

  // ── 2. 安定マップ (per_subtask を期間で合算) ──
  const sub = new Map<string, { miss: number; target: number }>()
  const addDiag = (summary: unknown) => {
    const d = (summary as { diagnosis?: DiagnosisJson } | null)?.diagnosis
    if (!d?.per_subtask) return
    for (const [sid, v] of Object.entries(d.per_subtask)) {
      if (!v || typeof v.miss !== "number" || typeof v.target !== "number") continue
      const e = sub.get(sid) ?? { miss: 0, target: 0 }
      e.miss += v.miss
      e.target += v.target
      sub.set(sid, e)
    }
  }
  for (const p of perfs) addDiag(p.analysisSummary)
  for (const p of pracs) addDiag(p.analysisSummary)

  const grid: GridCell[] = []
  for (const cross of ["same", "adj", "skip"] as const) {
    for (const dir of ["up", "down"] as const) {
      for (const dist of ["step", "leap"] as const) {
        const e = sub.get(`pitch_interval_${cross}_${dir}_${dist}`) ?? { miss: 0, target: 0 }
        grid.push({ cross, dir, dist, miss: e.miss, target: e.target })
      }
    }
  }

  // 奏法別 (音程+リズム両ツリーを合算) + 付点
  const TECHS: Array<[string, string]> = [
    ["slur", "スラー"], ["staccato", "スタッカート"], ["vibrato", "ビブラート"],
    ["trill", "トリル"], ["tremolo", "トレモロ"], ["pizzicato", "ピチカート"],
  ]
  const techRows: { label: string; miss: number; target: number }[] = []
  for (const [tid, label] of TECHS) {
    const a = sub.get(`pitch_tech_${tid}`) ?? { miss: 0, target: 0 }
    const b = sub.get(`rhythm_tech_${tid}`) ?? { miss: 0, target: 0 }
    const miss = a.miss + b.miss
    const target = a.target + b.target
    if (target >= 6) techRows.push({ label, miss, target })
  }
  const dotted = sub.get("rhythm_value_dotted")
  if (dotted && dotted.target >= 6) techRows.push({ label: "付点リズム", miss: dotted.miss, target: dotted.target })
  techRows.sort((a, b) => b.miss / Math.max(1, b.target) - a.miss / Math.max(1, a.target))

  // 音程×リズム バランス (期間前半 vs 後半で伸びも出す)
  const scored = [...perfs, ...pracs]
    .filter((p) => p.pitchAccuracy != null && p.timingAccuracy != null)
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
  const avg = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null)
  const pitchAll = avg(scored.map((p) => p.pitchAccuracy as number))
  const timingAll = avg(scored.map((p) => p.timingAccuracy as number))
  let pitchDelta: number | null = null
  let timingDelta: number | null = null
  if (scored.length >= 6) {
    const half = Math.floor(scored.length / 2)
    const p1 = avg(scored.slice(0, half).map((p) => p.pitchAccuracy as number))
    const p2 = avg(scored.slice(half).map((p) => p.pitchAccuracy as number))
    const t1 = avg(scored.slice(0, half).map((p) => p.timingAccuracy as number))
    const t2 = avg(scored.slice(half).map((p) => p.timingAccuracy as number))
    if (p1 != null && p2 != null) pitchDelta = round(p2 - p1)
    if (t1 != null && t2 != null) timingDelta = round(t2 - t1)
  }
  const balance = {
    pitchAvg: pitchAll != null ? round(pitchAll) : null,
    timingAvg: timingAll != null ? round(timingAll) : null,
    pitchDelta, timingDelta,
  }

  // ── 3. 所見 (苦手 × 練習不足の突き合わせ・ルールベース) ──
  const insights: KarteInsight[] = []
  const pref = `/${supabaseUserId}/practice`
  const rate = (e: { miss: number; target: number }) => (e.target > 0 ? e.miss / e.target : 0)

  // A: 跳躍が苦手 × アルペジオ不足
  const leapCells = grid.filter((c) => c.dist === "leap" && c.target >= 8)
  const worstLeap = leapCells.sort((a, b) => rate(b) - rate(a))[0]
  const arpPct = categoryShare.find((c) => c.label === categoryLabel("arpeggio"))?.pct ?? 0
  if (worstLeap && rate(worstLeap) >= 0.4 && arpPct < 10) {
    const dirL = worstLeap.dir === "down" ? "下" : "上"
    insights.push({
      tone: "warn",
      title: `「${dirL}に大きく跳ぶ音」が苦手。アルペジオ不足の可能性`,
      evidence: `跳躍のミス率 ${round(rate(worstLeap) * 100)}%（${worstLeap.target}音中${worstLeap.miss}ミス）× アルペジオ練習は全体の ${arpPct}%。跳躍の基礎はアルペジオで作られる。`,
      action: { label: "アルペジオを練習する →", href: `${pref}/arpeggio` },
    })
  }

  // B: 特定の調が不安定 × その調の音階不足
  const keysWithAvg = keyRows.filter((k) => k.avgPitch != null && k.count >= 2)
  if (keysWithAvg.length >= 2) {
    const worstKey = [...keysWithAvg].sort((a, b) => (a.avgPitch ?? 100) - (b.avgPitch ?? 100))[0]
    const others = keysWithAvg.filter((k) => k.label !== worstKey.label)
    const otherAvg = avg(others.map((k) => k.avgPitch as number))
    const scaleInKey = pracs.filter(
      (p) => p.practiceItem?.category === "scale" && p.practiceItem.keyTonic &&
        formatKey(p.practiceItem.keyTonic, p.practiceItem.keyMode) === worstKey.label,
    ).length
    if (otherAvg != null && (worstKey.avgPitch ?? 100) <= otherAvg - 8 && scaleInKey <= 1) {
      insights.push({
        tone: "warn",
        title: `${worstKey.label}だけ音程が崩れる。調の基礎が追いついていない`,
        evidence: `${worstKey.label}の音程 ${worstKey.avgPitch}点（他の調より${round(otherAvg - (worstKey.avgPitch ?? 0))}点低い）× ${worstKey.label}の音階練習はこの期間 ${scaleInKey}回。`,
        action: { label: `${worstKey.label}の音階から →`, href: `${pref}/scale` },
      })
    }
  }

  // C: 奏法・リズムの弱点 (最も悪い行)
  const worstTech = techRows[0]
  if (worstTech && worstTech.miss / worstTech.target >= 0.35) {
    insights.push({
      tone: "warn",
      title: `「${worstTech.label}」で崩れやすい`,
      evidence: `${worstTech.label}のミス率 ${round((worstTech.miss / worstTech.target) * 100)}%（${worstTech.target}音中${worstTech.miss}ミス）。`,
      action: { label: "練習メニューを見る →", href: pref },
    })
  }

  // D: 良い循環 (ポジティブ)
  const goodKey = keysWithAvg.find((k) => (k.avgPitch ?? 0) >= 85 && k.count >= 4)
  if (goodKey) {
    insights.push({
      tone: "good",
      title: `${goodKey.label}は「練習→安定」の良い循環ができている`,
      evidence: `${goodKey.label}を ${goodKey.count}回練習 → 音程 ${goodKey.avgPitch}点で安定。この進め方を他の調にも。`,
    })
  }

  // E: バランス
  if (balance.pitchAvg != null && balance.timingAvg != null && balance.timingAvg <= balance.pitchAvg - 8) {
    insights.push({
      tone: "warn",
      title: "いまの伸びしろはリズム",
      evidence: `音程 ${balance.pitchAvg}点に対してリズム ${balance.timingAvg}点。テンポガイドに合わせる練習が効く。`,
    })
  }

  // ── 4. 物語 (達成/マスター + 提出/添削/所見/お祝い) ──
  const events: KarteEvent[] = []
  for (const a of achievements) {
    events.push({ at: a.achievedAt.getTime(), date: fmtJp(a.achievedAt), kind: "achieve", text: `「${a.score.title}」を達成` })
    if (a.masteredAt) events.push({ at: a.masteredAt.getTime(), date: fmtJp(a.masteredAt), kind: "master", text: `「${a.score.title}」をマスター` })
  }
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: userId },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (link) {
      const [subs, fbs, obs, cels] = await Promise.all([
        prisma.assignment.findMany({
          where: { studentId: userId, submittedAt: { not: null } },
          orderBy: { submittedAt: "desc" }, take: 15,
          select: { submittedAt: true, submittedScore: true, score: { select: { title: true } }, practiceItem: { select: { title: true } } },
        }),
        prisma.teacherFeedback.findMany({
          where: { studentId: userId, teacherId: link.teacherId },
          orderBy: { updatedAt: "desc" }, take: 10,
          select: { updatedAt: true, scoreId: true },
        }),
        prisma.teacherObservation.findMany({
          where: { studentId: userId, teacherId: link.teacherId },
          orderBy: { createdAt: "desc" }, take: 15,
          select: { createdAt: true, tagIds: true, severity: true },
        }),
        prisma.message.findMany({
          where: { studentId: userId, teacherId: link.teacherId, fromTeacher: true, kind: "celebration" },
          orderBy: { createdAt: "desc" }, take: 10,
          select: { createdAt: true, body: true },
        }),
      ])
      const fbTitles = new Map<string, string>()
      const fbScoreIds = fbs.map((f) => f.scoreId).filter((s): s is string => !!s)
      if (fbScoreIds.length) {
        const ss = await prisma.score.findMany({ where: { id: { in: fbScoreIds } }, select: { id: true, title: true } })
        for (const s of ss) fbTitles.set(s.id, s.title)
      }
      for (const s of subs) if (s.submittedAt) events.push({
        at: s.submittedAt.getTime(), date: fmtJp(s.submittedAt), kind: "submit",
        text: `「${s.score?.title ?? s.practiceItem?.title ?? "課題"}」を提出${s.submittedScore != null ? `（${s.submittedScore}点）` : ""}`,
      })
      for (const f of fbs) events.push({
        at: f.updatedAt.getTime(), date: fmtJp(f.updatedAt), kind: "feedback",
        text: `${link.teacher.name} 先生が「${(f.scoreId && fbTitles.get(f.scoreId)) ?? "曲"}」を添削`,
      })
      for (const o of obs) {
        const tags = o.tagIds.map((t) => OBSERVATION_TAG_BY_ID[t]?.label).filter(Boolean).slice(0, 3).join("・")
        events.push({
          at: o.createdAt.getTime(), date: fmtJp(o.createdAt), kind: "observation",
          text: `先生の所見${o.severity === "focus" ? "【要重点】" : ""}：${tags || "コメント"}`,
        })
      }
      for (const c of cels) events.push({
        at: c.createdAt.getTime(), date: fmtJp(c.createdAt), kind: "celebration",
        text: `🎉 先生からお祝い：${c.body.slice(0, 40)}${c.body.length > 40 ? "…" : ""}`,
      })
    }
  } catch { /* 先生機能未整備でも物語は出す */ }
  events.sort((a, b) => b.at - a.at)

  return {
    period,
    practiceDays: daySet.size,
    recordingCount,
    categoryShare,
    keyRows,
    unusedKeys,
    dayCounts,
    streak,
    grid,
    techRows: techRows.slice(0, 6),
    balance,
    insights: insights.slice(0, 4),
    events: events.slice(0, 40),
  }
}
