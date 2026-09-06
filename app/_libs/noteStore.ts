/**
 * noteStore.ts — ノート属性ストアの読み手 (2026-09-05 Tetsuo確定)。
 *
 * 仕様: https://claude.ai/code/artifact/7a7d2c1f-57b0-4b40-926a-cd88c1d8513a
 * 正となる表は NoteProfile (音のかたち) / ScoreNote (音の並び・演奏順) / PerformanceNote (演奏の明細)。
 * 集計は保存されていない。ここで、単位を選び (§5-1)、明細を束ね (§5-2)、教材を探す (§5-3)。
 *
 *   1 単位を選ぶ   Performance を 誰の・いつの・どの曲の で絞る。版が違う演奏は再解析まで除く
 *   2 明細を束ねる 明細 → 並び → かたち(今・前) をつなぎ、タブの列で束ねる。ミスはその音への移動に帰属 (R3)
 *   3 教材を探す   並びの教材側を同じ条件で数え、★以下・棚の中で最多の1件
 *
 * 足切りは読み手ごとの値 (R4): ホーム累計 10音・演奏直後 3音・基礎練 2音。足切りが先、
 * 候補が無ければ「候補なし」、全部100%なら「弱点なし」。
 * 純粋な部分 (束ねる・選ぶ) と DB に触る部分 (NoteStoreSource) を分け、前者はテストで叩く。
 */
import { Prisma } from "@/app/generated/prisma"
import { prisma } from "./prisma"

// ───────────────────────── 型 ─────────────────────────

export const TECHS = [
  "slur", "portato", "staccato", "bow_staccato", "spiccato", "ricochet", "pizzicato",
  "tremolo", "vibrato", "trill", "mordent", "glissando", "harmonic",
] as const
export type Tech = (typeof TECHS)[number]
export const TECH_COLUMNS: Record<Tech, string> = {
  slur: "techSlur", portato: "techPortato", staccato: "techStaccato", bow_staccato: "techBowStaccato",
  spiccato: "techSpiccato", ricochet: "techRicochet", pizzicato: "techPizzicato", tremolo: "techTremolo",
  vibrato: "techVibrato", trill: "techTrill", mordent: "techMordent", glissando: "techGlissando", harmonic: "techHarmonic",
}

/** かたち1行 ・ NoteProfile。値の規約は lib/note_store.py と同じ ("none"/"unknown"/-1/-2) */
export type ProfileRow = {
  id: number
  noteCount: number
  pitch1: string; pitch2: string; pitch3: string; pitch4: string
  string1: string; finger1: number
  noteType1: string; dotted1: boolean; durationBeats1: number
  position: number
  techSlur: boolean; techPortato: boolean; techStaccato: boolean; techBowStaccato: boolean; techSpiccato: boolean
  techRicochet: boolean; techPizzicato: boolean; techTremolo: boolean; techVibrato: boolean; techTrill: boolean
  techMordent: boolean; techGlissando: boolean; techHarmonic: boolean
  tupletActual: number; tupletNormal: number
  onBeat: boolean; chordCont: boolean; restBefore: number
}
export const UNKNOWN = "unknown"
export const NONE = "none"
export const POS_UNKNOWN = -1

/** 明細1行 ・ かたち付き */
export type DetailRow = {
  performanceId: string
  noteIndex: number
  pitchOk: boolean | null
  startOk: boolean | null
  evaluationStatus: string
  expectedStartSec: number | null
  /** comparison の音名 (旧 noteStats と同じ表記) ・ 音程のずれ ・ 期待周波数。成長カルテの派生サマリが使う */
  noteName?: string | null
  pitchCentsError?: number | null
  expectedPitchHz?: number | null
  cur: ProfileRow
  prev: ProfileRow | null
  /** スラーの中の位置 (2026-09-06): そのスラーの音数 と 何番目か (0 = 最初の音)。スラーの外・古い並びは null */
  slurLen?: number | null
  slurPos?: number | null
}

/** 単位 (§5-1) */
export type Unit = {
  userId: string
  since?: Date
  until?: Date
  target?: { type: "score" | "practice"; id: string }
  lastN?: number
  /** 最初の N 回 (2026-09-06 比べる尺度「はじめの自分」= 最初の 5 回の演奏) */
  firstN?: number
  performanceId?: string
  /** 通し演奏だけ (部分録音 rangeFromNote あり を除く)。基礎練②④が使う */
  wholeOnly?: boolean
}

export type TabKey = "pitch" | "position" | "technique" | "fingering"
/**
 * グループのキー (2026-09-05 Tetsuo: わざ・ポジション移動・重音は音の高さと組にする)
 *   "pitch|G4|C5"          音の移動
 *   "fingering|G4|A4"      速い指の切り替え
 *   "technique|slur|G4"    わざ + 音
 *   "position|1|3|A4"      ポジション移動 + 移動先の音
 *   "slur|4|G4|A4"         4 音スラーの中の 前の音→今の音 (2026-09-06 Tetsuo: 何音一緒のスラーかで教材を変える。最初の音は数えない)
 *   "chord|5度|D4"          重音 + 低い方の音
 * 教材を探すときは二段階: まず音まで一致するもの、無ければ音を問わず (奏法 / 移動 / 度数 で合算) 探す。
 */
export type GroupKey = string
export type Agg = Map<GroupKey, { target: number; miss: number }>

/** 速い指の切り替えの境目 (秒)。fastSwitch の最初の帯と同じ。Tetsuo: 一旦この1帯で始める */
export const FAST_SWITCH_SEC = 0.3

// ───────────────────────── 束ねる (純粋) ─────────────────────────

export type MissKind = "pitch" | "timing" | "any"

function isMiss(r: DetailRow, kind: MissKind): boolean {
  if (r.evaluationStatus === "not_detected") return true
  if (kind === "any") return r.pitchOk === false || r.startOk === false
  return kind === "pitch" ? r.pitchOk === false : r.startOk === false
}

function fingerPressed(f: number): boolean {
  return f > 0 // 0 = 開放弦、-1 = 不明、-2 = 無し
}

/** かたちの音名 ("F#4" / "Bb4" / "C##5") → MIDI。不明・なし・読めない形は null */
export function pitchToMidi(pitch: string): number | null {
  const m = /^([A-G])([#b]*)(-?\d+)$/.exec(pitch)
  if (!m) return null
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  let alter = 0
  for (const ch of m[2]) alter += ch === "#" ? 1 : -1
  return 12 * (parseInt(m[3], 10) + 1) + base[m[1]] + alter
}

/**
 * 1行がどの束に入るか。gapSec は前の音の鳴り始めからの実時間 (フィンガリング用)。
 * ミスは「その音への移動」に帰属する (R3) ので、束は 前のかたち→今のかたち で作る。
 */
export function groupKeysOf(tab: TabKey, r: DetailRow, gapSec: number | null): GroupKey[] {
  const cur = r.cur
  const prev = r.prev
  switch (tab) {
    case "pitch":
      if (!prev || prev.pitch1 === UNKNOWN || cur.pitch1 === UNKNOWN) return []
      return [`pitch|${prev.pitch1}|${cur.pitch1}`]
    case "fingering":
      if (!prev || prev.pitch1 === UNKNOWN || cur.pitch1 === UNKNOWN) return []
      if (!fingerPressed(prev.finger1) || !fingerPressed(cur.finger1)) return [] // 開放弦は指を使わない
      if (prev.pitch1 === cur.pitch1) return [] // 同じ音名の連続は指を替えない
      if (gapSec === null || gapSec >= FAST_SWITCH_SEC) return []
      return [`fingering|${prev.pitch1}|${cur.pitch1}`]
    case "position":
      if (!prev || prev.position === POS_UNKNOWN || cur.position === POS_UNKNOWN) return []
      if (prev.position === cur.position) return []
      if (cur.pitch1 === UNKNOWN) return [] // 移動先の音と組にする。音名不明は入らない
      return [`position|${prev.position}|${cur.position}|${cur.pitch1}`]
    case "technique": {
      // わざは音の高さと組にする (2026-09-05 Tetsuo: 「スラー」だけでは教材が選べない)。音名不明の音は入らない
      if (cur.pitch1 === UNKNOWN) return []
      const keys: GroupKey[] = []
      for (const t of TECHS) {
        if (!(cur as unknown as Record<string, boolean>)[TECH_COLUMNS[t]]) continue
        if (t === "slur" && r.slurLen != null && r.slurPos != null) {
          // スラーは「N 音スラーの中の 前の音→今の音」(2026-09-06 Tetsuo)。最初の音 (弓を返す音) は数えない
          if (r.slurPos >= 1 && prev && prev.pitch1 !== UNKNOWN) keys.push(`slur|${r.slurLen}|${prev.pitch1}|${cur.pitch1}`)
          continue
        }
        keys.push(`technique|${t}|${cur.pitch1}`)
      }
      return keys
    }
  }
}

/**
 * 明細を束ねる (§5-2)。rows は演奏ごとに noteIndex 順であること。
 * フィンガリングの実時間は、同じ演奏の直前の行との expectedStartSec の差 (fastSwitch と同じ定義)。
 */
export function aggregate(tab: TabKey, rows: DetailRow[], missKind: MissKind = "pitch"): Agg {
  const agg: Agg = new Map()
  let lastPerf: string | null = null
  let lastStart: number | null = null
  for (const r of rows) {
    let gap: number | null = null
    if (r.performanceId === lastPerf && lastStart !== null && r.expectedStartSec !== null) {
      gap = r.expectedStartSec - lastStart
    }
    for (const k of groupKeysOf(tab, r, gap)) {
      const a = agg.get(k) ?? { target: 0, miss: 0 }
      a.target += 1
      if (isMiss(r, missKind)) a.miss += 1
      agg.set(k, a)
    }
    lastPerf = r.performanceId
    lastStart = r.expectedStartSec
  }
  return agg
}

export type Weakest = { key: GroupKey; successPct: number; target: number; miss: number }
export type PickResult = { weakest: Weakest | null; status: "ok" | "候補なし" | "弱点なし"; bestPct: number | null }

/** 足切り → 候補なし → 全部100%なら弱点なし → いちばん低い1件 (同率は弾いた回数の多い方) */
export function pickWeakest(agg: Agg, minTarget: number): PickResult {
  const cands = [...agg.entries()].filter(([, v]) => v.target >= minTarget)
  if (cands.length === 0) return { weakest: null, status: "候補なし", bestPct: null }
  let best: Weakest | null = null
  let bestPct = -1
  for (const [key, v] of cands) {
    const pct = Math.round((1 - v.miss / v.target) * 100)
    if (pct > bestPct) bestPct = pct
    if (!best || pct < best.successPct || (pct === best.successPct && v.target > best.target)) {
      best = { key, successPct: pct, target: v.target, miss: v.miss }
    }
  }
  if (best && best.miss === 0) return { weakest: null, status: "弱点なし", bestPct }
  return { weakest: best, status: "ok", bestPct }
}

/** 束のキーを分解する */
export function parseKey(key: GroupKey): { tab: TabKey | "slur" | "chord"; a: string; b: string; c: string } {
  const [tab, a = "", b = "", c = ""] = key.split("|")
  return { tab: tab as TabKey | "slur" | "chord", a, b, c }
}

// ───────────────────────── DB (差し替え可能) ─────────────────────────

export type MaterialHit = { itemId: string; count: number }

export interface NoteStoreSource {
  /** 単位に合う演奏の明細を、演奏ごと noteIndex 順で返す */
  fetchDetail(unit: Unit): Promise<DetailRow[]>
  /** 束に合う音を最も多く含む教材 ・ ★以下・棚の中 */
  findMaterial(key: GroupKey, star: number, shelves: string[]): Promise<MaterialHit | null>
}

const PROFILE_SELECT = `
  id, "noteCount", "pitch1", "pitch2", "pitch3", "pitch4", "string1", "finger1",
  "noteType1", "dotted1", "durationBeats1", "position",
  "techSlur", "techPortato", "techStaccato", "techBowStaccato", "techSpiccato", "techRicochet", "techPizzicato",
  "techTremolo", "techVibrato", "techTrill", "techMordent", "techGlissando", "techHarmonic",
  "tupletActual", "tupletNormal", "onBeat", "chordCont", "restBefore"`

/** 単位に合う演奏を選ぶ (§5-1)。版が違う演奏は再解析まで除く */
async function selectPerformances(unit: Unit): Promise<{ kind: "score" | "practice"; id: string; targetId: string; createdAt: Date }[]> {
  const out: { kind: "score" | "practice"; id: string; targetId: string; createdAt: Date }[] = []
  const range = unit.since || unit.until ? { ...(unit.since ? { gte: unit.since } : {}), ...(unit.until ? { lt: unit.until } : {}) } : null
  const idWhere = unit.performanceId ? { id: unit.performanceId } : {}
  const wholeWhere = unit.wholeOnly ? { rangeFromNote: null } : {}
  const timeWhere = { ...(range ? { createdAt: range } : {}), ...idWhere, ...wholeWhere }
  const timeWherePractice = { ...(range ? { uploadedAt: range } : {}), ...idWhere }
  if (!unit.target || unit.target.type === "score") {
    const ps = await prisma.performance.findMany({
      where: {
        userId: unit.userId,
        scoreNoteVersion: { not: null },
        ...(unit.target ? { scoreId: unit.target.id } : {}),
        ...timeWhere,
      },
      select: { id: true, scoreId: true, createdAt: true, scoreNoteVersion: true, score: { select: { scoreNoteVersion: true } } },
    })
    for (const p of ps) {
      if (p.scoreNoteVersion && p.scoreNoteVersion === p.score.scoreNoteVersion) out.push({ kind: "score", id: p.id, targetId: p.scoreId, createdAt: p.createdAt })
    }
  }
  if (!unit.target || unit.target.type === "practice") {
    const ps = await prisma.practicePerformance.findMany({
      where: {
        userId: unit.userId,
        scoreNoteVersion: { not: null },
        ...(unit.target ? { practiceItemId: unit.target.id } : {}),
        ...timeWherePractice,
      },
      select: { id: true, practiceItemId: true, uploadedAt: true, scoreNoteVersion: true, practiceItem: { select: { scoreNoteVersion: true } } },
    })
    for (const p of ps) {
      // PracticePerformance の日時列は uploadedAt
      if (p.scoreNoteVersion && p.scoreNoteVersion === p.practiceItem.scoreNoteVersion) out.push({ kind: "practice", id: p.id, targetId: p.practiceItemId, createdAt: p.uploadedAt })
    }
  }
  out.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  if (unit.firstN) return out.slice(0, unit.firstN)
  return unit.lastN ? out.slice(-unit.lastN) : out
}

type RawDetail = {
  performanceId: string; noteIndex: number; pitchOk: boolean | null; startOk: boolean | null
  evaluationStatus: string; expectedStartSec: number | null; profileId: number; prevProfileId: number | null
  noteName: string | null; pitchCentsError: number | null; expectedPitchHz: number | null
  slurLen: number | null; slurPos: number | null
}

/** 明細 → 並び (かたちの番号だけ)。かたちの中身は別に1回で引く (行ごとの副問い合わせは重い) */
async function fetchDetailFor(kind: "score" | "practice", perfs: { id: string; targetId: string }[]): Promise<RawDetail[]> {
  if (perfs.length === 0) return []
  const ids = perfs.map((p) => p.id)
  const perfTable = kind === "score" ? Prisma.raw('"Performance"') : Prisma.raw('"PracticePerformance"')
  const targetCol = kind === "score" ? Prisma.raw('"scoreId"') : Prisma.raw('"practiceItemId"')
  return prisma.$queryRaw<RawDetail[]>(Prisma.sql`
    SELECT pn."performanceId", pn."noteIndex", pn."pitchOk", pn."startOk", pn."evaluationStatus", pn."expectedStartSec",
           pn."noteName", pn."pitchCentsError", pn."expectedPitchHz",
           sn."profileId", sn."prevProfileId", sn."slurLen", sn."slurPos"
    FROM "PerformanceNote" pn
    JOIN ${perfTable} x ON x.id = pn."performanceId"
    JOIN "ScoreNote" sn ON sn."targetType" = ${kind}::"ScoreNoteTarget" AND sn."targetId" = x.${targetCol} AND sn."noteIndex" = pn."noteIndex"
    WHERE pn."performanceKind" = ${kind}::"PerformanceKind" AND pn."performanceId" = ANY(${ids})`)
}

async function fetchProfiles(ids: number[]): Promise<Map<number, ProfileRow>> {
  if (ids.length === 0) return new Map()
  const rows = await prisma.$queryRaw<ProfileRow[]>(Prisma.sql`SELECT ${Prisma.raw(PROFILE_SELECT)} FROM "NoteProfile" WHERE id = ANY(${ids})`)
  return new Map(rows.map((r) => [r.id, r]))
}

/** 教材側の述語。束のキーごとに SQL の条件を組む */
function materialPredicate(key: GroupKey): Prisma.Sql {
  const { tab, a, b, c } = parseKey(key)
  switch (tab) {
    case "pitch":
      return Prisma.sql`prev."pitch1" = ${a} AND cur."pitch1" = ${b}`
    case "position":
      return c
        ? Prisma.sql`prev."position" = ${parseInt(a, 10)} AND cur."position" = ${parseInt(b, 10)} AND cur."pitch1" = ${c}`
        : Prisma.sql`prev."position" = ${parseInt(a, 10)} AND cur."position" = ${parseInt(b, 10)}`
    case "technique": {
      const col = TECH_COLUMNS[a as Tech]
      if (!col) throw new Error(`unknown technique: ${a}`)
      return b
        ? Prisma.sql`cur.${Prisma.raw(`"${col}"`)} = true AND cur."pitch1" = ${b}`
        : Prisma.sql`cur.${Prisma.raw(`"${col}"`)} = true`
    }
    case "fingering":
      // 前の音の秒 (教材の想定テンポで換算) が短く、直前に休符が無く、両方とも指を押さえる音
      return Prisma.sql`prev."pitch1" = ${a} AND cur."pitch1" = ${b} AND prev."finger1" > 0 AND cur."finger1" > 0
        AND cur."restBefore" = 0 AND s.prev_dur IS NOT NULL AND s.prev_dur < ${FAST_SWITCH_SEC}`
    case "slur":
      // N 音スラーの 2 音目以降で 前の音→今の音
      return Prisma.sql`s."slurLen" = ${parseInt(a, 10)} AND s."slurPos" >= 1 AND prev."pitch1" = ${b} AND cur."pitch1" = ${c}`
    default:
      throw new Error(`unknown key: ${key}`)
  }
}

export const prismaSource: NoteStoreSource = {
  async fetchDetail(unit) {
    const perfs = await selectPerformances(unit)
    const [a, b] = await Promise.all([
      fetchDetailFor("score", perfs.filter((p) => p.kind === "score")),
      fetchDetailFor("practice", perfs.filter((p) => p.kind === "practice")),
    ])
    const raw = [...a, ...b]
    const idSet = new Set<number>()
    for (const r of raw) { idSet.add(r.profileId); if (r.prevProfileId !== null) idSet.add(r.prevProfileId) }
    const profiles = await fetchProfiles([...idSet])
    // 演奏の時系列順に並べ直す (aggregate は演奏内の順序だけを見るので、演奏の並びは createdAt 順で十分)
    const order = new Map(perfs.map((p, i) => [p.id, i]))
    raw.sort((x, y) => (order.get(x.performanceId)! - order.get(y.performanceId)!) || (x.noteIndex - y.noteIndex))
    const out: DetailRow[] = []
    for (const r of raw) {
      const cur = profiles.get(r.profileId)
      if (!cur) continue
      out.push({
        performanceId: r.performanceId, noteIndex: r.noteIndex, pitchOk: r.pitchOk, startOk: r.startOk,
        evaluationStatus: r.evaluationStatus, expectedStartSec: r.expectedStartSec,
        noteName: r.noteName, pitchCentsError: r.pitchCentsError, expectedPitchHz: r.expectedPitchHz,
        cur, prev: r.prevProfileId !== null ? profiles.get(r.prevProfileId) ?? null : null,
        slurLen: r.slurLen, slurPos: r.slurPos,
      })
    }
    return out
  },
  async findMaterial(key, star, shelves) {
    // 2026-09-05 Tetsuo: 教材側は毎回数えない。写し MaterialBundleCount を読む。
    // 写しは教材の解析時に ScoreNote と一緒に書き直される。並びとの一致は
    // music-analyzer/scripts/rebuild_material_bundle_counts.py --check で守る。
    // 二段階: 音まで一致する教材 → 無ければ音を問わず (coarseWhere) 探す
    const hits = await findMaterialsForKey(key, star, shelves, 1)
    return hits[0] ?? null
  },
}

/** 検査用: その教材に、その束に合う音が何個あるか。写し (MaterialBundleCount) ではなく並び (ScoreNote) を数える ・ 独立した確認 */
/**
 * 削除の後始末 (F13)。ScoreNote / PerformanceNote / MaterialBundleCount は本体 (Score / PracticeItem /
 * Performance / PracticePerformance) と外部キーで結ばれていない (複合主キー・種別列) ので、本体を消す側が呼ぶ。
 * 読み手は本体を通して絞るので残骸が画面に出ることはないが、増え続けないように消す。
 */
export async function deleteNoteStoreForPerformance(kind: "score" | "practice", performanceId: string): Promise<number> {
  const r = await prisma.performanceNote.deleteMany({ where: { performanceKind: kind, performanceId } })
  return r.count
}
export async function deleteNoteStoreForTarget(kind: "score" | "practice", targetId: string): Promise<{ scoreNotes: number; bundles: number }> {
  const [a, b] = await prisma.$transaction([
    prisma.scoreNote.deleteMany({ where: { targetType: kind, targetId } }),
    kind === "practice" ? prisma.materialBundleCount.deleteMany({ where: { targetId } }) : prisma.materialBundleCount.deleteMany({ where: { targetId: "__none__" } }),
  ])
  return { scoreNotes: a.count, bundles: b.count }
}

/**
 * ある奏法の音 (音の高さを問わず) を最も多く含む ★以下の教材を上位 limit 件。
 * わざ詳細ページ用: グループは "technique|slur|G4" と音ごとに分かれているので、奏法で合算して探す。
 */
export async function findMaterialsForTechnique(tech: Tech, star: number, shelves: string[], limit: number): Promise<MaterialHit[]> {
  const rows = await prisma.$queryRaw<{ id: string; c: number }[]>(Prisma.sql`
    SELECT mb."targetId" AS id, sum(mb.count)::int AS c
    FROM "MaterialBundleCount" mb
    JOIN "PracticeItem" pi ON pi.id = mb."targetId"
    WHERE mb.kind = 'technique' AND mb."fromValue" = ${tech}
      AND pi."isPublished" = true AND pi.category::text = ANY(${shelves}) AND pi.star IS NOT NULL AND pi.star <= ${star}
    GROUP BY mb."targetId"
    ORDER BY sum(mb.count) DESC, mb."targetId"
    LIMIT ${limit}`)
  return rows.map((r) => ({ itemId: r.id, count: Number(r.c) }))
}

/**
 * 二段階目の条件 (音を問わない)。わざ = 同じ奏法、ポジション移動 = 同じ移動、重音 = 同じ度数。
 * 音の移動・速い指の切り替えは音そのものが条件なので二段階目は無い (null)。
 */
function coarseWhere(key: GroupKey): Prisma.Sql | null {
  const { tab, a, b, c } = parseKey(key)
  // 音の無い旧形式のキー ("technique|slur" / "position|1|3" / "chord|5度"・音を足す前のピンに残る) も
  // 二段階目の条件で引けるようにする (音を問わない条件そのものなので同じ where で足りる)
  switch (tab as string) {
    case "technique": return Prisma.sql`mb.kind = 'technique' AND mb."fromValue" = ${a}`
    case "position": return b ? Prisma.sql`mb.kind = 'position' AND mb."fromValue" = ${a} AND mb."toValue" = ${b}` : null
    case "chord": return Prisma.sql`mb.kind = 'chord' AND mb."fromValue" = ${a}`
    case "slur": return Prisma.sql`mb.kind = 'slur' AND mb."fromValue" = ${b} AND mb."toValue" = ${c}`   // 音数を問わずスラーの中の同じ移動
    default: return null
  }
}

/**
 * 段階的に緩める (2026-09-06 Tetsuo確定): スラーの束は 同じ音数 → 前後 1 音 → スラーの中の同じ移動 (coarseWhere) → 移動だけ (pitch|prev|cur)。
 * 戻り値 = 完全一致の次に試す bundleKey の組 (順に)。他の束は空
 */
export function relaxedKeys(key: GroupKey): GroupKey[][] {
  const { tab, a, b, c } = parseKey(key)
  if (tab !== "slur") return []
  const n = parseInt(a, 10)
  const near = [n - 1, n + 1].filter((x) => x >= 2).map((x) => `slur|${x}|${b}|${c}`)
  return [near]
}
/** 二段階目でも無いときの最後の束 (スラー → 移動だけ) */
export function fallbackKey(key: GroupKey): GroupKey | null {
  const { tab, b, c } = parseKey(key)
  return tab === "slur" ? `pitch|${b}|${c}` : null
}

/**
 * グループの音を最も多く含む ★以下の教材を上位 limit 件 (写し MaterialBundleCount)。
 * 二段階 (2026-09-05 Tetsuo): まず音まで一致する教材、1件も無ければ音を問わず合算して探す。
 */
export async function findMaterialsForKey(key: GroupKey, star: number, shelves: string[], limit: number): Promise<MaterialHit[]> {
  const byKeys = async (keys: GroupKey[]) => prisma.$queryRaw<{ id: string; c: number }[]>(Prisma.sql`
    SELECT mb."targetId" AS id, sum(mb.count)::int AS c
    FROM "MaterialBundleCount" mb
    JOIN "PracticeItem" pi ON pi.id = mb."targetId"
    WHERE mb."bundleKey" = ANY(${keys})
      AND pi."isPublished" = true AND pi.category::text = ANY(${shelves}) AND pi.star IS NOT NULL AND pi.star <= ${star}
    GROUP BY mb."targetId"
    ORDER BY sum(mb.count) DESC, mb."targetId"
    LIMIT ${limit}`)
  const exact = await byKeys([key])
  if (exact.length > 0) return exact.map((r) => ({ itemId: r.id, count: Number(r.c) }))
  // 段階的に緩める (スラー: 前後 1 音の音数)
  for (const keys of relaxedKeys(key)) {
    if (keys.length === 0) continue
    const near = await byKeys(keys)
    if (near.length > 0) return near.map((r) => ({ itemId: r.id, count: Number(r.c) }))
  }
  const where = coarseWhere(key)
  if (!where) return []
  const coarse = await prisma.$queryRaw<{ id: string; c: number }[]>(Prisma.sql`
    SELECT mb."targetId" AS id, sum(mb.count)::int AS c
    FROM "MaterialBundleCount" mb
    JOIN "PracticeItem" pi ON pi.id = mb."targetId"
    WHERE ${where}
      AND pi."isPublished" = true AND pi.category::text = ANY(${shelves}) AND pi.star IS NOT NULL AND pi.star <= ${star}
    GROUP BY mb."targetId"
    ORDER BY sum(mb.count) DESC, mb."targetId"
    LIMIT ${limit}`)
  if (coarse.length > 0) return coarse.map((r) => ({ itemId: r.id, count: Number(r.c) }))
  // 最後: 移動だけ (スラーの外でも同じ 前の音→今の音 を含む教材)
  const fb = fallbackKey(key)
  if (!fb) return []
  const last = await byKeys([fb])
  return last.map((r) => ({ itemId: r.id, count: Number(r.c) }))
}

/** 検査用: その教材にそのグループが何回あるか。音まで一致 (exact) → 音を問わず (coarse) → 無し */
export async function materialBundleCountFor(itemId: string, key: GroupKey): Promise<{ count: number; stage: "exact" | "coarse" | "none" }> {
  const ex = await prisma.materialBundleCount.findUnique({ where: { targetId_bundleKey: { targetId: itemId, bundleKey: key } }, select: { count: true } })
  if (ex && ex.count > 0) return { count: ex.count, stage: "exact" }
  const where = coarseWhere(key)
  if (!where) return { count: 0, stage: "none" }
  const rows = await prisma.$queryRaw<{ c: number }[]>(Prisma.sql`SELECT coalesce(sum(mb.count), 0)::int AS c FROM "MaterialBundleCount" mb WHERE mb."targetId" = ${itemId} AND ${where}`)
  const c = Number(rows[0]?.c ?? 0)
  return { count: c, stage: c > 0 ? "coarse" : "none" }
}

/** 隣り合う構成音の度数 → 3度 4度 5度 6度 オクターブ その他 (lib/note_store.py chord_interval_label と同じ語) */
export function chordIntervalLabel(pLow: string, pHigh: string): string {
  const d = (p: string): number | null => {
    const m = /^([A-G])[#b]*(-?\d+)$/.exec(p)
    return m ? "CDEFGAB".indexOf(m[1]) + 7 * parseInt(m[2], 10) : null
  }
  const a = d(pLow), b = d(pHigh)
  if (a === null || b === null) return "その他"
  const deg = Math.abs(b - a) + 1
  return ({ 3: "3度", 4: "4度", 5: "5度", 6: "6度", 8: "オクターブ" } as Record<number, string>)[deg] ?? "その他"
}

/** 重音のグループ "chord|5度|D4" (度数 + 低い方の音) を演奏の明細から数える (成功率つき)。ミスは音程 */
export function aggregateChords(rows: DetailRow[]): Agg {
  const agg: Agg = new Map()
  for (const r of rows) {
    if (r.cur.noteCount <= 1) continue
    const pitches = [r.cur.pitch1, r.cur.pitch2, r.cur.pitch3, r.cur.pitch4].slice(0, r.cur.noteCount)
    for (let i = 0; i + 1 < pitches.length; i++) {
      if (pitches[i] === UNKNOWN) continue
      const k = `chord|${chordIntervalLabel(pitches[i], pitches[i + 1])}|${pitches[i]}`
      const a = agg.get(k) ?? { target: 0, miss: 0 }
      a.target += 1
      if (isMiss(r, "pitch")) a.miss += 1
      agg.set(k, a)
    }
  }
  return agg
}

export async function countBundleInMaterial(key: GroupKey, itemId: string): Promise<number> {
  const pred = materialPredicate(key)
  const rows = await prisma.$queryRaw<{ c: number }[]>(Prisma.sql`
    WITH s AS (
      SELECT sn.*, LAG(sn."durationSec") OVER (PARTITION BY sn."targetId" ORDER BY sn."noteIndex") AS prev_dur
      FROM "ScoreNote" sn WHERE sn."targetType" = 'practice'::"ScoreNoteTarget" AND sn."targetId" = ${itemId}
    )
    SELECT count(*)::int AS c FROM s
    JOIN "NoteProfile" cur ON cur.id = s."profileId"
    LEFT JOIN "NoteProfile" prev ON prev.id = s."prevProfileId"
    WHERE ${pred}`)
  return Number(rows[0]?.c ?? 0)
}

/** 教材ごとに、与えた束のキーのうちどれを含むか (写し MaterialBundleCount から)。基礎練②④の「苦手移動の含有数」用 */
export async function bundleHitsByItem(itemIds: string[], keys: GroupKey[]): Promise<Map<string, Set<GroupKey>>> {
  const out = new Map<string, Set<GroupKey>>()
  if (itemIds.length === 0 || keys.length === 0) return out
  const rows = await prisma.materialBundleCount.findMany({
    where: { targetId: { in: itemIds }, bundleKey: { in: keys }, count: { gt: 0 } },
    select: { targetId: true, bundleKey: true },
  })
  for (const r of rows) {
    if (!out.has(r.targetId)) out.set(r.targetId, new Set())
    out.get(r.targetId)!.add(r.bundleKey)
  }
  return out
}
