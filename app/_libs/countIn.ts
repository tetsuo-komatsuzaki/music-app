/**
 * カウントインの設計 (2026-08-27 確定)。
 *
 * 従来は拍子に関係なく「四分音符 × 4回」固定だった。3拍子の曲では1拍はみ出し、
 * 6/8 では曲の拍と関係ない刻みになるため、演奏者が入る場所を見失っていた。
 *
 * 方針:
 *   1クリック = その拍子の「拍」。四分音符固定にしない
 *   回数     = 1小節ぶんの拍数。ただし短すぎるとテンポを掴めないので下限を設ける
 *
 * BPM はアプリ全体で四分音符基準 (analyze_musicxml.py の SECONDS_PER_QUARTER = 60/BPM)。
 * ここでも「四分音符1つ = 60/bpm 秒」を前提に、拍の長さを四分音符何個分かで表す。
 */

export type CountInPlan = {
  /** クリックの回数 */
  clicks: number
  /** クリックの間隔 (秒) */
  intervalSec: number
  /** 1拍が四分音符いくつ分か (4分の4なら1、6/8なら1.5、2/2なら2) */
  beatInQuarters: number
  /** 画面に出す説明用のラベル (例: "3拍子") */
  label: string
}

/** 短すぎるとテンポを掴めないため、この秒数を下回るなら1小節足す */
const MIN_TOTAL_SEC = 1.5
/** 1小節の拍数がこれ未満なら2小節ぶん鳴らす */
const MIN_BEATS_PER_BAR = 3

/**
 * 拍の長さを四分音符何個分かで返す。
 *   分母4 → ♩ (1.0)   分母2 → 𝅗𝅥 (2.0)
 *   分母8 で分子が3の倍数 (6/9/12) → ♩. (1.5)   その他の分母8 (3/5/7) → ♪ (0.5)
 */
export function beatInQuarters(numerator: number, denominator: number): number {
  if (denominator === 2) return 2
  // 複合拍子 (6/8, 9/8, 12/8) は付点四分が拍。
  // 3/8 は分子が3の倍数だが単純拍子 (八分が拍) なので 6 以上を条件に入れる。
  if (denominator === 8) return numerator % 3 === 0 && numerator >= 6 ? 1.5 : 0.5
  if (denominator === 16) return numerator % 3 === 0 && numerator >= 6 ? 0.75 : 0.25
  return 1 // 分母4 とその他
}

/** 1小節あたりの拍数 */
export function beatsPerBar(numerator: number, denominator: number): number {
  const q = beatInQuarters(numerator, denominator)
  const barInQuarters = (numerator * 4) / denominator
  const n = Math.round(barInQuarters / q)
  return n > 0 ? n : 4
}

/**
 * カウントインの計画を作る。
 * @param bpm      録音テンポ (四分音符基準)
 * @param numerator   拍子の分子。不明なら 4
 * @param denominator 拍子の分母。不明なら 4
 */
export function planCountIn(
  bpm: number,
  numerator?: number | null,
  denominator?: number | null,
): CountInPlan {
  const num = numerator && numerator > 0 ? Math.round(numerator) : 4
  const den = denominator && denominator > 0 ? Math.round(denominator) : 4
  const safeBpm = bpm > 0 ? bpm : 90

  const q = beatInQuarters(num, den)
  const intervalSec = (60 / safeBpm) * q
  const perBar = beatsPerBar(num, den)

  // 1小節ぶん。短い拍子は2小節。それでも 1.5 秒未満なら小節を足す
  let bars = perBar < MIN_BEATS_PER_BAR ? 2 : 1
  while (perBar * bars * intervalSec < MIN_TOTAL_SEC && bars < 4) bars += 1

  return {
    clicks: perBar * bars,
    intervalSec,
    beatInQuarters: q,
    label: `${den}分の${num}`,
  }
}
