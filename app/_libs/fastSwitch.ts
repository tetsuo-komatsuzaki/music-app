// 速い指の切り替え (2026-09-02 Tetsuo確定・記録の分析ページの新項目)。
//
// 何を見るか: 「前の音から次の音までの実時間」= 指を切り替える猶予。
// この値は録音テンポを反映した秒数なので、テンポが速い場合も短い音符が続く場合も
// 1つの数字にまとまる。その帯ごとに、音程とタイミングの成功率を出す。
//
// 除外 (2026-09-02 Tetsuo確定):
//   - 開放弦 = 指を使わないので切り替えの話に入らない (弦上位置 0)
//   - 同じ音名が続く音 = 指を替える必要がない
//
// データ源 (2026-09-05 ノート属性ストア 段4-4 で切替): 明細 (PerformanceNote → ScoreNote → NoteProfile)。
//   expectedStartSec / noteName / pitchOk / startOk は演奏の行、弦上の位置は かたち (string1 / pitch1) から。
//   ストレージのファイル直読みはやめた。集計は指板とは別なので aggregate.ts には混ぜない。
import { prismaSource, type DetailRow, type Unit } from "./noteStore"
import { profileCell } from "./fingerboard/aggregate"

export type SwitchBand = {
  label: string
  /** 判定できた音数 (音程) */
  notes: number
  /** 音程の成功率 (%)。判定音が MIN_NOTES 未満なら null */
  pitchPct: number | null
  /** タイミングの成功率 (%) */
  timingPct: number | null
}
export type FastSwitchData = {
  bands: SwitchBand[]
  /** 集計に使えた録音数 */
  perfCount: number
}

const MIN_NOTES = 20
const BANDS: { label: string; lo: number; hi: number }[] = [
  { label: "0.3秒未満", lo: 0, hi: 0.3 },
  { label: "0.3〜0.6秒", lo: 0.3, hi: 0.6 },
  { label: "0.6〜1.0秒", lo: 0.6, hi: 1.0 },
  { label: "1.0秒以上", lo: 1.0, hi: Infinity },
]

/** 明細 (演奏の時系列順・演奏内は noteIndex 順) → 帯ごとの成功率。純関数 */
export function fastSwitchRows(rows: DetailRow[]): FastSwitchData {
  const agg = BANDS.map((b) => ({ ...b, p: { n: 0, ok: 0 }, r: { n: 0, ok: 0 } }))
  const used = new Set<string>()
  for (let i = 1; i < rows.length; i++) {
    const n = rows[i], prev = rows[i - 1]
    if (n.performanceId !== prev.performanceId) continue
    if (n.noteIndex !== prev.noteIndex + 1) continue        // 切れていたら比べない
    const sk = profileCell(n.cur)
    if (!sk || sk.n === 0) continue                          // 弦不明・開放弦は除く
    const name = n.noteName ?? n.cur.pitch1, prevName = prev.noteName ?? prev.cur.pitch1
    if (name && prevName && name === prevName) continue      // 同音連続は除く
    if (prev.expectedStartSec == null || n.expectedStartSec == null) continue
    const gap = n.expectedStartSec - prev.expectedStartSec
    if (!(gap > 0)) continue
    const band = agg.find((b) => gap >= b.lo && gap < b.hi)
    if (!band) continue
    used.add(n.performanceId)
    if (typeof n.pitchOk === "boolean") { band.p.n++; if (n.pitchOk) band.p.ok++ }
    if (typeof n.startOk === "boolean") { band.r.n++; if (n.startOk) band.r.ok++ }
  }
  const pct = (b: { n: number; ok: number }) => (b.n >= MIN_NOTES ? Math.round((b.ok / b.n) * 100) : null)
  return {
    bands: agg.map((b) => ({ label: b.label, notes: b.p.n, pitchPct: pct(b.p), timingPct: pct(b.r) })),
    perfCount: used.size,
  }
}

/** 直近 sinceDays 日の演奏 (曲+教材あわせて直近 2×maxPerfs 本) */
export async function buildFastSwitch(userId: string, sinceDays: number, maxPerfs = 30): Promise<FastSwitchData> {
  const since = new Date(Date.now() - sinceDays * 864e5)
  return fastSwitchRows(await prismaSource.fetchDetail({ userId, since, lastN: maxPerfs * 2 }))
}
/** 単位 (窓 ・ 最初の N 回) を指定する版 (2026-09-06 比べる尺度) */
export async function buildFastSwitchUnit(unit: Unit): Promise<FastSwitchData> {
  return fastSwitchRows(await prismaSource.fetchDetail(unit))
}
