/**
 * techniqueQuality.ts — 奏法そのものができているかの判定 (2026-09-12)。
 *
 * これまで画面に出していた「精度」は、奏法タグの付いた音の音程とリズムの成功率だった。
 * 音が合っているかであって、スタッカートが短く切れているかではない。
 * ここは音の長さ・音量の包絡・f0 の往復といった測定値から、奏法そのものの合否を出す。
 *
 * 【なぜ画面側で判定できるのか】
 *   測定値は解析器が録音ごとに計算し、PerformanceNote に 1 音ずつ保存されている
 *   (durRatio / attackPeakFrac / decayRatio / pitchAltCount / ampStrokeCount …)。
 *   判定は「測定値をしきい値と比べる」だけなので、解析器に触らず TypeScript で書ける。
 *   music-analyzer/lib/subtask_judges.py に同じ判定があるが、そちらは結果を平均して
 *   捨てており内訳が残らない。しきい値はあちらの値をそのまま写している。
 *
 * 【しきい値は全部が仮の値】
 *   実演奏の分布を見て決める前提で置かれている ([[project_technique_threshold_calibration_pending]])。
 *   ここを変えるときは必ず分布を見てからにすること。
 *
 * 【測れない音は分母から外す】
 *   測定値が無い音・判定不能な音は「できなかった」ではない。数えない。
 *   古い録音は測定値の列が空なので、そのぶん対象が減る (2026-07 より前は入っていない)。
 */
import type { DetailRow } from "./noteStore"
import { TECH_COLUMNS, type Tech } from "./noteStore"

// ── しきい値 (subtask_judges.py の写し。すべて仮の値) ──
/** staccato / spiccato: 楽譜の音価に対してこれ以下なら「短く切れている」 */
export const DUR_RATIO_STACCATO_MAX = 0.5
/** portato: 切るが切りすぎない範囲 */
export const DUR_RATIO_PORTATO_MIN = 0.5
export const DUR_RATIO_PORTATO_MAX = 0.85
/** trill: 主音と補助音の往復がこれ以上 */
export const TRILL_MIN_ALTERNATIONS = 4
/** trill: 往復の幅。狭すぎ・広すぎはトリルではない */
export const TRILL_MIN_SEMITONES = 0.7
export const TRILL_MAX_SEMITONES = 3.0
/** pizzicato: ピークが区間の前方にある = 鋭いアタック */
export const PIZZ_MAX_ATTACK_FRAC = 0.4
/** pizzicato: 末尾がピークの半分以下 = 撥弦の自然減衰 */
export const PIZZ_MAX_DECAY_RATIO = 0.5

/**
 * 長さがこれを超えたら測定値を信じない (2026-09-12)。
 * 楽譜の音価の 1.5 倍を超えて鳴ることは、書かれた音符の演奏としては起きない。
 * 実測で 2.34 や 1.41 が出たが、これは検出が音の切れ目を見失って
 * 隣の音まで 1 つの塊として測った結果だった。こういう値を「できていない」と
 * 数えると、検出の失敗を演奏の失敗として記録してしまう。測れなかった扱いにする。
 * 仮の値。分布を見て決め直すこと。
 */
export const MAX_PLAUSIBLE_DUR_RATIO = 1.5

/** 判定を持っている奏法。ここに無いものは「まだ測れない」 */
export const QUALITY_TECHS = ["staccato", "spiccato", "portato", "trill", "pizzicato"] as const
export type QualityTech = (typeof QUALITY_TECHS)[number]

/**
 * 1 音の合否。true=できている / false=できていない / null=測れない。
 * null は分母に入れない。測定値が無いだけで「できなかった」にはしない。
 */
export function judgeNote(tech: QualityTech, r: DetailRow): boolean | null {
  switch (tech) {
    case "staccato":
    case "spiccato":
      if (r.durRatio == null || r.durRatio > MAX_PLAUSIBLE_DUR_RATIO) return null
      return r.durRatio <= DUR_RATIO_STACCATO_MAX
    case "portato":
      if (r.durRatio == null || r.durRatio > MAX_PLAUSIBLE_DUR_RATIO) return null
      return r.durRatio >= DUR_RATIO_PORTATO_MIN && r.durRatio <= DUR_RATIO_PORTATO_MAX
    case "trill": {
      if (r.pitchAltCount == null || r.pitchAltSemitones == null) return null
      // 往復が無い・広すぎるならトリルとして弾けていない
      if (r.pitchAltSemitones < TRILL_MIN_SEMITONES || r.pitchAltSemitones > TRILL_MAX_SEMITONES) return false
      return r.pitchAltCount >= TRILL_MIN_ALTERNATIONS
    }
    case "pizzicato":
      if (r.attackPeakFrac == null || r.decayRatio == null) return null
      return r.attackPeakFrac <= PIZZ_MAX_ATTACK_FRAC && r.decayRatio <= PIZZ_MAX_DECAY_RATIO
  }
}

export type QualityTally = {
  /** 判定できた音の数 */
  judged: number
  /** そのうちできていた音 */
  ok: number
  /** その奏法の音だが測定値が無くて判定できなかった数 */
  unmeasured: number
  /** ok / judged を 0-100 に。judged=0 なら null */
  pct: number | null
}

/** その奏法の音だけを集めて数える。測れない音は unmeasured に寄せ、分母に入れない */
export function tallyQuality(tech: QualityTech, rows: DetailRow[]): QualityTally {
  const col = TECH_COLUMNS[tech as Tech]
  let judged = 0
  let ok = 0
  let unmeasured = 0
  for (const r of rows) {
    if (!(r.cur as unknown as Record<string, boolean>)[col]) continue
    const v = judgeNote(tech, r)
    if (v === null) { unmeasured++; continue }
    judged++
    if (v) ok++
  }
  return { judged, ok, unmeasured, pct: judged > 0 ? Math.round((ok / judged) * 100) : null }
}

/** 全奏法ぶん。判定を持たない奏法は返さない */
export function tallyAll(rows: DetailRow[]): Map<QualityTech, QualityTally> {
  const out = new Map<QualityTech, QualityTally>()
  for (const t of QUALITY_TECHS) out.set(t, tallyQuality(t, rows))
  return out
}
