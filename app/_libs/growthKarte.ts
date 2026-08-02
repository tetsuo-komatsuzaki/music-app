// 成長カルテの集計 (MVP・2026-08-02)。
// 演奏記録を「意味のある知見」に変換する: 実態(量と内訳) / 安定マップ / 所見(相関) / 物語。
// すべて既存データ (Performance/PracticePerformance の analysisSummary.diagnosis
// per_subtask {miss,target}・達成/提出/添削/所見) から生成。新テーブル不要。
import { prisma } from "./prisma"
import { storageAdmin } from "./storageAdmin"
import { encodeSignedUrl } from "./encodeSignedUrl"
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

// ── 技術マップ (先生ありユーザー特典・project_skill_map_spec 準拠) ────────────
// 習得の正 = UserLessonClear ∪ UserTagAcquisition(state≠REVOKED)。旧UserTechniqueMasteryは不使用。
// 安定度% = per_subtask(pitch_tech_*/rhythm_tech_*)の実測のみ(音程・リズム由来の代理値)。

export type SkillNodeState = "stable" | "wobble" | "acquired_nodata" | "ready" | "locked"

export interface SkillNode {
  id: string // subtask tech id ("slur") or "position" / "double"
  label: string
  lane: "bow" | "left"
  star: number // 登録star (正本 = docs/arcoda-design-spec.md §2-2b)
  state: SkillNodeState
  /** オンボ自己申告のみで習得扱い (仮習得) */
  provisional: boolean
  /** 安定度% (100 - ミス率)。データ少は null */
  pct: number | null
  miss: number
  target: number
  /** 関連する先生の癖タグ (直近の所見から) */
  obsTags: string[]
  /** 処方箋リンク先 (practice カテゴリ or トップ) */
  practiceHref: string
}

export interface SkillMapData {
  currentStar: number
  nodes: SkillNode[]
}

// 技術定義: 登録star は §2-2b 確定値 ([[project_technique_star_source_of_truth]])
// tagKeys = UserLessonClear/UserTagAcquisition の tagKey 候補 (v72改名等の揺れを吸収)
const SKILL_DEFS: Array<{
  id: string; label: string; lane: "bow" | "left"; star: number
  tagType: "technique" | "position" | "double_stop"
  tagKeys: string[]
  subIds: string[] // per_subtask の合算対象
  practiceCat: string | null
  obsTagIds: string[] // 関連する癖タグ (observationCatalog)
}> = [
  // 右手 (弓)
  { id: "slur", label: "スラー", lane: "bow", star: 1, tagType: "technique", tagKeys: ["スラー"], subIds: ["pitch_tech_slur", "rhythm_tech_slur"], practiceCat: "bowing", obsTagIds: ["bow_elbow_lag", "bow_distribution"] },
  { id: "staccato", label: "スタッカート", lane: "bow", star: 2, tagType: "technique", tagKeys: ["スタッカート"], subIds: ["pitch_tech_staccato", "rhythm_tech_staccato"], practiceCat: "bowing", obsTagIds: ["bow_pressure_heavy"] },
  { id: "portato", label: "ポルタート", lane: "bow", star: 2, tagType: "technique", tagKeys: ["ポルタート"], subIds: ["pitch_tech_portato", "rhythm_tech_portato"], practiceCat: "bowing", obsTagIds: [] },
  { id: "bow_staccato", label: "連続スタッカート", lane: "bow", star: 2, tagType: "technique", tagKeys: ["連続スタッカート", "ボウ・スタッカート"], subIds: ["pitch_tech_bow_staccato", "rhythm_tech_bow_staccato"], practiceCat: "bowing", obsTagIds: [] },
  { id: "tremolo", label: "トレモロ", lane: "bow", star: 2, tagType: "technique", tagKeys: ["トレモロ"], subIds: ["pitch_tech_tremolo", "rhythm_tech_tremolo"], practiceCat: "bowing", obsTagIds: ["bow_wrist_stiff"] },
  { id: "pizzicato", label: "ピチカート", lane: "bow", star: 2, tagType: "technique", tagKeys: ["ピチカート"], subIds: ["pitch_tech_pizzicato", "rhythm_tech_pizzicato"], practiceCat: null, obsTagIds: [] },
  { id: "spiccato", label: "スピッカート", lane: "bow", star: 3, tagType: "technique", tagKeys: ["スピッカート"], subIds: ["pitch_tech_spiccato", "rhythm_tech_spiccato"], practiceCat: "bowing", obsTagIds: ["bow_wrist_stiff"] },
  { id: "ricochet", label: "リコシェ", lane: "bow", star: 4, tagType: "technique", tagKeys: ["リコシェ"], subIds: ["pitch_tech_ricochet", "rhythm_tech_ricochet"], practiceCat: "bowing", obsTagIds: [] },
  // 左手
  { id: "position", label: "ポジション移動", lane: "left", star: 4, tagType: "position", tagKeys: [], subIds: [], practiceCat: "position_shift", obsTagIds: ["left_shift_tense", "pitch_after_shift"] },
  { id: "double", label: "重音", lane: "left", star: 2, tagType: "double_stop", tagKeys: [], subIds: [], practiceCat: "double_stop", obsTagIds: ["left_press_hard"] },
  { id: "trill", label: "トリル", lane: "left", star: 3, tagType: "technique", tagKeys: ["トリル"], subIds: ["pitch_tech_trill", "rhythm_tech_trill"], practiceCat: null, obsTagIds: ["left_press_hard"] },
  { id: "mordent", label: "プラルトリラーとモルデント", lane: "left", star: 3, tagType: "technique", tagKeys: ["プラルトリラーとモルデント", "モルデント"], subIds: ["pitch_tech_mordent", "rhythm_tech_mordent"], practiceCat: null, obsTagIds: [] },
  { id: "vibrato", label: "ビブラート", lane: "left", star: 4, tagType: "technique", tagKeys: ["ビブラート"], subIds: ["pitch_tech_vibrato", "rhythm_tech_vibrato"], practiceCat: null, obsTagIds: ["tone_vibrato", "left_press_hard"] },
  { id: "glissando", label: "グリッサンド", lane: "left", star: 5, tagType: "technique", tagKeys: ["グリッサンド"], subIds: ["pitch_tech_glissando", "rhythm_tech_glissando"], practiceCat: null, obsTagIds: [] },
  { id: "harmonic", label: "ハーモニクス", lane: "left", star: 5, tagType: "technique", tagKeys: ["ナチュラル・ハーモニクス", "ハーモニクス"], subIds: ["pitch_tech_harmonic", "rhythm_tech_harmonic"], practiceCat: null, obsTagIds: [] },
]

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
  // 技術マップ (先生ありユーザーのみ。無しは null → 特典ティーザー表示)
  skillMap: SkillMapData | null
  // 癖の人体マップ (先生ありユーザーのみ)。タグごとに最新の所見1件 (severity/日付)
  bodyObs: BodyObsTag[] | null
}

export interface BodyObsTag {
  tagId: string
  severity: string | null
  date: string
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
  // 先生リンクと直近の癖タグ (技術マップでも使うため外に出す)
  let teacherLink: { teacherId: string; teacherName: string } | null = null
  const recentObsTagIds = new Set<string>()
  const bodyObsMap = new Map<string, BodyObsTag>() // タグ→最新所見 (obsは新しい順なので初出=最新)
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: userId },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (link) {
      teacherLink = { teacherId: link.teacherId, teacherName: link.teacher.name }
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
          orderBy: { createdAt: "desc" }, take: 40, // 経過記録で行が増えるためタグ最新状態の網羅用に多めに
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
      for (const [oi, o] of obs.entries()) {
        // 表現評価 (expr_*) の行は癖系の表示に流さない (Phase1で表現力の章が担当)
        const kuseTagIds = o.tagIds.filter((t) => !t.startsWith("expr_"))
        if (kuseTagIds.length === 0 && o.tagIds.length > 0) continue
        for (const t of kuseTagIds) {
          if (!bodyObsMap.has(t)) bodyObsMap.set(t, { tagId: t, severity: o.severity, date: fmtJp(o.createdAt) })
        }
        if (oi >= 15) continue // 物語に流すのは直近15件まで (残りは状態把握のみ)
        const tags = kuseTagIds.map((t) => OBSERVATION_TAG_BY_ID[t]?.label).filter(Boolean).slice(0, 3).join("・")
        const text =
          o.severity === "resolved" ? `🌱 癖を克服：${tags || "コメント"}` :
          o.severity === "improving" ? `🌿 癖が良くなってきた：${tags || "コメント"}` :
          `先生の所見${o.severity === "focus" ? "【要重点】" : ""}：${tags || "コメント"}`
        events.push({ at: o.createdAt.getTime(), date: fmtJp(o.createdAt), kind: "observation", text })
      }
      // 技術マップの「!」= 現在アクティブな癖のみ (最新が🌱克服のタグは外す)
      for (const [t, e] of bodyObsMap) if (e.severity !== "resolved") recentObsTagIds.add(t)
      for (const c of cels) events.push({
        at: c.createdAt.getTime(), date: fmtJp(c.createdAt), kind: "celebration",
        text: `🎉 先生からお祝い：${c.body.slice(0, 40)}${c.body.length > 40 ? "…" : ""}`,
      })
    }
  } catch { /* 先生機能未整備でも物語は出す */ }
  events.sort((a, b) => b.at - a.at)

  // ── 技術マップ (先生ありユーザーのみ・spec: project_skill_map_spec) ──
  let skillMap: SkillMapData | null = null
  if (teacherLink) {
    try {
      const [clears, acqs, starRow] = await Promise.all([
        prisma.userLessonClear.findMany({
          where: { userId },
          select: { tagType: true, tagKey: true },
        }),
        prisma.userTagAcquisition.findMany({
          where: { userId, state: { not: "REVOKED" } },
          select: { tagType: true, tagKey: true },
        }),
        prisma.userStarProgress.findUnique({ where: { userId }, select: { currentStar: true } }),
      ])
      const currentStar = starRow?.currentStar ?? 1
      const clearSet = new Set(clears.map((c) => `${c.tagType}:${c.tagKey}`))
      const acqSet = new Set(acqs.map((c) => `${c.tagType}:${c.tagKey}`))
      const clearTypes = new Set(clears.map((c) => c.tagType))
      const acqTypes = new Set(acqs.map((c) => c.tagType))

      const sumPrefix = (prefixes: string[]) => {
        let miss = 0, target = 0
        for (const [sid, e] of sub.entries()) {
          if (prefixes.some((p) => sid.startsWith(p))) { miss += e.miss; target += e.target }
        }
        return { miss, target }
      }

      const nodes: SkillNode[] = SKILL_DEFS.map((d) => {
        // 習得: technique はタグ名一致 / position・double_stop は種別に1つでもあれば
        let inClear = false, inAcq = false
        if (d.tagType === "technique") {
          inClear = d.tagKeys.some((k) => clearSet.has(`technique:${k}`))
          inAcq = d.tagKeys.some((k) => acqSet.has(`technique:${k}`))
        } else {
          inClear = clearTypes.has(d.tagType)
          inAcq = acqTypes.has(d.tagType)
        }
        const acquired = inClear || inAcq

        // 安定度 (per_subtask 実測のみ)
        const agg = d.subIds.length
          ? d.subIds.reduce((a, sid) => {
              const e = sub.get(sid)
              return e ? { miss: a.miss + e.miss, target: a.target + e.target } : a
            }, { miss: 0, target: 0 })
          : d.id === "position"
            ? (() => {
                // 「移動を伴う」ペアのみ (同一ポジ内 X_X は変化なし箱=前提条件なので除外)
                let miss = 0, target = 0
                for (const [sid, e] of sub.entries()) {
                  const m = /^(?:pitch|rhythm)_posshift_([0-9a-z]+)_([0-9a-z]+)$/.exec(sid)
                  if (m && m[1] !== m[2]) { miss += e.miss; target += e.target }
                }
                return { miss, target }
              })()
            : sumPrefix(["pitch_double_", "rhythm_double_"])

        let state: SkillNodeState
        let pct: number | null = null
        if (!acquired) {
          state = d.star > currentStar ? "locked" : "ready"
        } else if (agg.target >= 8) {
          pct = Math.max(0, round(100 - (agg.miss / agg.target) * 100))
          state = pct < 70 ? "wobble" : "stable"
        } else {
          state = "acquired_nodata"
        }

        return {
          id: d.id, label: d.label, lane: d.lane, star: d.star, state,
          provisional: acquired && !inClear,
          pct, miss: agg.miss, target: agg.target,
          obsTags: d.obsTagIds.filter((t) => recentObsTagIds.has(t)).map((t) => OBSERVATION_TAG_BY_ID[t]?.label).filter((s): s is string => !!s),
          practiceHref: d.practiceCat ? `/${supabaseUserId}/practice/${d.practiceCat}` : `/${supabaseUserId}/practice`,
        }
      })
      nodes.sort((a, b) => a.star - b.star || a.label.localeCompare(b.label))
      skillMap = { currentStar, nodes }
    } catch {
      skillMap = null
    }
  }

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
    skillMap,
    bodyObs: teacherLink ? [...bodyObsMap.values()] : null,
  }
}

// ═══════════════════════════════════════════════════════════════════
// 技術の詳細分析 (/progress/skill/[techId]・先生あり特典・モック743beec0承認済)
// 指導注釈つき推移 / 先生の指導履歴 / 聴き比べ / 処方箋
// ═══════════════════════════════════════════════════════════════════

export const SKILL_IDS = SKILL_DEFS.map((d) => d.id)

export interface SkillSeriesPoint { at: number; date: string; pct: number; target: number }
export interface SkillAnnotation {
  at: number
  date: string
  kind: "observation" | "lesson_clear"
  label: string
  severity?: string | null
}
export interface SkillListenItem { date: string; title: string; pct: number | null; audioUrl: string | null }
export interface SkillGuidance { date: string; severity: string | null; tags: string[]; comment: string | null }

export interface SkillDetailData {
  id: string
  label: string
  lane: "bow" | "left"
  star: number
  state: SkillNodeState
  provisional: boolean
  pct: number | null
  miss: number
  target: number
  practiceHref: string
  series: SkillSeriesPoint[]
  annotations: SkillAnnotation[]
  /** 直近の指導(所見/クリア)前後の安定度変化。null=判定材料不足 */
  effect: { label: string; delta: number } | null
  listen: { old: SkillListenItem; new: SkillListenItem } | null
  guidance: SkillGuidance[]
}

/** 技術1つの詳細分析 (全期間)。先生なし/不明IDは null (呼び手でリダイレクト)。 */
export async function buildSkillDetail(
  userId: string, supabaseUserId: string, techId: string,
): Promise<SkillDetailData | null> {
  const def = SKILL_DEFS.find((d) => d.id === techId)
  if (!def) return null

  const link = await prisma.teacherStudent.findFirst({
    where: { studentId: userId },
    orderBy: { createdAt: "asc" },
    select: { teacherId: true },
  })
  if (!link) return null // 先生あり特典

  const [perfs, pracs, clears, acqs, starRow, obsRows] = await Promise.all([
    prisma.performance.findMany({
      where: { userId },
      orderBy: { uploadedAt: "asc" },
      select: { uploadedAt: true, analysisSummary: true, audioPath: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId },
      orderBy: { uploadedAt: "asc" },
      select: { uploadedAt: true, analysisSummary: true, audioPath: true, practiceItem: { select: { title: true } } },
    }),
    prisma.userLessonClear.findMany({ where: { userId }, select: { tagType: true, tagKey: true, clearedAt: true } }),
    prisma.userTagAcquisition.findMany({ where: { userId, state: { not: "REVOKED" } }, select: { tagType: true, tagKey: true } }),
    prisma.userStarProgress.findUnique({ where: { userId }, select: { currentStar: true } }),
    prisma.teacherObservation.findMany({
      where: { studentId: userId, teacherId: link.teacherId },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: { createdAt: true, tagIds: true, severity: true, comment: true },
    }),
  ])

  // この技術の per_subtask 集計対象か
  const posRe = /^(?:pitch|rhythm)_posshift_([0-9a-z]+)_([0-9a-z]+)$/
  const inScope = (sid: string): boolean => {
    if (def.subIds.length) return def.subIds.includes(sid)
    if (def.id === "position") {
      const m = posRe.exec(sid)
      return !!m && m[1] !== m[2]
    }
    return sid.startsWith("pitch_double_") || sid.startsWith("rhythm_double_")
  }
  const aggOf = (summary: unknown): { miss: number; target: number } => {
    const d = (summary as { diagnosis?: DiagnosisJson } | null)?.diagnosis
    let miss = 0
    let target = 0
    if (d?.per_subtask) {
      for (const [sid, v] of Object.entries(d.per_subtask)) {
        if (!inScope(sid) || typeof v?.miss !== "number" || typeof v?.target !== "number") continue
        miss += v.miss
        target += v.target
      }
    }
    return { miss, target }
  }

  // 録音ごとの安定度 (対象3音以上のみ点にする) + 聴き比べ候補
  type Rec = { at: Date; title: string; audioPath: string | null; agg: { miss: number; target: number } }
  const recs: Rec[] = [
    ...perfs.map((p) => ({ at: p.uploadedAt, title: p.score?.title ?? "曲", audioPath: p.audioPath || null, agg: aggOf(p.analysisSummary) })),
    ...pracs.map((p) => ({ at: p.uploadedAt, title: p.practiceItem?.title ?? "教材", audioPath: p.audioPath || null, agg: aggOf(p.analysisSummary) })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime())

  const scored = recs.filter((r) => r.agg.target >= 3)
  const pctOf = (r: Rec) => Math.max(0, round(100 - (r.agg.miss / r.agg.target) * 100))
  const series: SkillSeriesPoint[] = scored.map((r) => ({
    at: r.at.getTime(),
    date: fmtJp(r.at),
    pct: pctOf(r),
    target: r.agg.target,
  }))

  // 全期間の合算 → 状態判定 (マップと同じ規則)
  const total = scored.reduce((a, r) => ({ miss: a.miss + r.agg.miss, target: a.target + r.agg.target }), { miss: 0, target: 0 })
  const clearSet = new Set(clears.map((c) => c.tagType + ":" + c.tagKey))
  const acqSet = new Set(acqs.map((c) => c.tagType + ":" + c.tagKey))
  let inClear = false
  let inAcq = false
  if (def.tagType === "technique") {
    inClear = def.tagKeys.some((k) => clearSet.has("technique:" + k))
    inAcq = def.tagKeys.some((k) => acqSet.has("technique:" + k))
  } else {
    inClear = clears.some((c) => c.tagType === def.tagType)
    inAcq = acqs.some((c) => c.tagType === def.tagType)
  }
  const acquired = inClear || inAcq
  const currentStar = starRow?.currentStar ?? 1
  let state: SkillNodeState
  let pct: number | null = null
  if (!acquired) {
    state = def.star > currentStar ? "locked" : "ready"
  } else if (total.target >= 8) {
    pct = Math.max(0, round(100 - (total.miss / total.target) * 100))
    state = pct < 70 ? "wobble" : "stable"
  } else {
    state = "acquired_nodata"
  }

  // 注釈: 関連する所見 + この技術のレッスンクリア
  const related = obsRows.filter((o) => o.tagIds.some((t) => def.obsTagIds.includes(t)))
  const annotations: SkillAnnotation[] = related.map((o) => {
    const base = o.tagIds.filter((t) => def.obsTagIds.includes(t)).map((t) => OBSERVATION_TAG_BY_ID[t]?.label).filter(Boolean).join("・") || "所見"
    const prefix = o.severity === "resolved" ? "🌱克服 " : o.severity === "improving" ? "🌿 " : ""
    return {
      at: o.createdAt.getTime(),
      date: fmtJp(o.createdAt),
      kind: "observation" as const,
      label: prefix + base,
      severity: o.severity,
    }
  })
  for (const c of clears) {
    const hit = def.tagType === "technique"
      ? c.tagType === "technique" && def.tagKeys.includes(c.tagKey)
      : c.tagType === def.tagType
    if (hit) annotations.push({ at: c.clearedAt.getTime(), date: fmtJp(c.clearedAt), kind: "lesson_clear", label: "レッスンクリア" })
  }
  annotations.sort((a, b) => a.at - b.at)

  // 指導の効果: 直近の注釈の前後で平均を比較 (各1点以上)
  let effect: { label: string; delta: number } | null = null
  for (let i = annotations.length - 1; i >= 0; i--) {
    const anno = annotations[i]
    const before = series.filter((s) => s.at < anno.at)
    const after = series.filter((s) => s.at > anno.at)
    if (before.length >= 1 && after.length >= 1) {
      const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length
      const delta = round(avg(after.map((s) => s.pct)) - avg(before.map((s) => s.pct)))
      effect = { label: anno.kind === "lesson_clear" ? "レッスンクリア" : "所見「" + anno.label + "」", delta }
      break
    }
  }

  // 聴き比べ: 最古と最新 (2点以上あるとき)
  let listen: SkillDetailData["listen"] = null
  if (scored.length >= 2) {
    const first = scored[0]
    const last = scored[scored.length - 1]
    const sign = async (path: string | null) =>
      path
        ? await storageAdmin.storage.from("performances").createSignedUrl(path, 600)
            .then((r) => encodeSignedUrl(r.data?.signedUrl) ?? null)
            .catch(() => null)
        : null
    const [oldUrl, newUrl] = await Promise.all([sign(first.audioPath), sign(last.audioPath)])
    listen = {
      old: { date: fmtJp(first.at), title: first.title, pct: pctOf(first), audioUrl: oldUrl },
      new: { date: fmtJp(last.at), title: last.title, pct: pctOf(last), audioUrl: newUrl },
    }
  }

  // 指導履歴 (新しい順・5件)
  const guidance: SkillGuidance[] = related
    .slice()
    .reverse()
    .slice(0, 5)
    .map((o) => ({
      date: fmtJp(o.createdAt),
      severity: o.severity,
      tags: o.tagIds.map((t) => OBSERVATION_TAG_BY_ID[t]?.label).filter((s): s is string => !!s),
      comment: o.comment,
    }))

  return {
    id: def.id,
    label: def.label,
    lane: def.lane,
    star: def.star,
    state,
    provisional: acquired && !inClear,
    pct,
    miss: total.miss,
    target: total.target,
    practiceHref: def.practiceCat ? "/" + supabaseUserId + "/practice/" + def.practiceCat : "/" + supabaseUserId + "/practice",
    series,
    annotations,
    effect,
    listen,
    guidance,
  }
}
