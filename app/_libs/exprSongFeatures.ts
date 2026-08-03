// 曲の表現特徴 (2026-08-04): analysis.json を集約して「この曲がどんな表現を求める曲か」を数値化。
// Score.exprFeatures に保存するキャッシュの計算 (A案: TS側集約・オンデマンド+バックフィル)。
// 変換表 (先生語彙⇔記号特徴) は project_karte_growth_requirements 確定6が正。
// ルバート (rit/フェルマータ) は当面対象外 — 「事実は保存・解釈は都度計算」の分担で、
// タグ判定はここの EXPR_MATCHERS が担い、曲側には生の数字だけ持たせる。
import type { SymbolSourceAnalysis } from "@/app/_libs/scoreSymbols"

/** Score.exprFeatures の中身 (0〜1の率 + 個数) */
export type ExprFeatures = {
  v: 1 // スキーマ版数 (計算式を変えたら上げて再計算対象にする)
  notes: number // 対象音符数 (率の分母)
  slurDensity: number // スラー内の音符率
  longSlurRate: number // 4音以上の長スラー内の音符率
  staccatoDensity: number // スタッカート系音符率
  dynamicsVariety: number // 強弱記号の種類数 (p/f/mf…)
  hairpinCount: number // クレッシェンド/デクレッシェンド区間数
  longToneRate: number // 2拍以上 (half/whole/breve) の音符率
  lowRegisterRate: number // 低音域 (<440Hz = G/D線帯) の音符率
  vibratoTag: boolean // 曲にビブラート指示があるか (is_trill等でなく wavy-line/技法タグは呼び手が併用)
}

const LONG_TYPES = new Set(["half", "whole", "breve"])
const STACCATO_ARTS = new Set(["staccato", "staccatissimo", "spiccato"])

export function computeExprFeatures(analysis: SymbolSourceAnalysis): ExprFeatures {
  const notes = (analysis.notes ?? []).filter((n) => n && typeof n.note_index === "number")
  const total = notes.length || 1

  // スラー区間 → 音符カバレッジ
  const slurs = (analysis.spanners?.slurs ?? []).filter((s) => s && s.end >= s.start)
  const inSlur = new Set<number>()
  const inLongSlur = new Set<number>()
  for (const s of slurs) {
    const len = s.end - s.start + 1
    for (let i = s.start; i <= s.end; i++) {
      inSlur.add(i)
      if (len >= 4) inLongSlur.add(i)
    }
  }

  let staccato = 0
  let longTone = 0
  let low = 0
  let vibrato = false
  const dynamics = new Set<string>()
  for (const n of notes) {
    if (n.articulations?.some((a) => STACCATO_ARTS.has(a))) staccato++
    if (n.type && LONG_TYPES.has(n.type)) longTone++
    const hz = n.pitches?.[0]
    if (typeof hz === "number" && hz > 0 && hz < 440) low++
    if (n.dynamic) dynamics.add(n.dynamic)
    if (n.expressions?.some((e) => /vibrato/i.test(e))) vibrato = true
  }

  const covered = notes.filter((n) => inSlur.has(n.note_index)).length
  const coveredLong = notes.filter((n) => inLongSlur.has(n.note_index)).length
  const r = (x: number) => Math.round((x / total) * 1000) / 1000

  return {
    v: 1,
    notes: notes.length,
    slurDensity: r(covered),
    longSlurRate: r(coveredLong),
    staccatoDensity: r(staccato),
    dynamicsVariety: dynamics.size,
    hairpinCount: (analysis.spanners?.hairpins ?? []).length,
    longToneRate: r(longTone),
    lowRegisterRate: r(low),
    vibratoTag: vibrato,
  }
}

// ── 変換表 (2026-08-04 Tetsuo確定: 相対順位方式・上位5%) ────────────────
// 係数による絶対式は廃止。「その語彙の軸の数字が、カタログ全曲の中で上位5%に入る曲」だけを合う曲とする。
// 軸は説明可能な単一数値のみ (根拠を一言で言える形):
//   レガート=スラー内音符率 / 歯切れ=スタッカート音符率 /
//   強弱=強弱の書き込み量(種類数+ヘアピン区間数) / 音の深み=低音域(G/D線帯)音符率
export const EXPR_AXES: Record<string, { axis: (f: ExprFeatures) => number; mood: string }> = {
  expr_legato_singing: { axis: (f) => f.slurDensity, mood: "歌うように ゆったり流れる曲" },
  expr_articulation: { axis: (f) => f.staccatoDensity, mood: "軽快で はずむような曲" },
  expr_dynamics: { axis: (f) => f.dynamicsVariety + f.hairpinCount, mood: "表情の起伏が ゆたかな曲" },
  expr_tone_depth: { axis: (f) => f.lowRegisterRate, mood: "しっとり深く ひびく曲" },
}

/** 「合う曲」に入れる割合 (カタログ全曲の上位5%・2026-08-04確定) */
export const EXPR_TOP_RATIO = 0.05

/** 上位5%のしきい値 (値の降順で ceil(N*5%) 番目の値)。全カタログの軸値を渡す */
export function percentileThreshold(allValues: number[], topRatio = EXPR_TOP_RATIO): number {
  const positive = allValues.filter((v) => v > 0).sort((a, b) => b - a)
  if (positive.length === 0) return Infinity // 全曲0 → 合う曲なし
  const k = Math.max(1, Math.ceil(allValues.length * topRatio))
  return positive[Math.min(k, positive.length) - 1]
}

/**
 * 表現タグに合う曲 (相対順位方式)。
 * threshold はカタログ全曲から percentileThreshold で求めた値。
 * songs (ユーザーの★帯) のうち軸値がしきい値以上のものを降順で返す。0曲なら正直に空。
 */
export function rankSongsForExpr(
  tagId: string,
  songs: Array<{ id: string; title: string; features: ExprFeatures }>,
  threshold: number,
): Array<{ id: string; title: string; value: number }> {
  const def = EXPR_AXES[tagId]
  if (!def) return []
  return songs
    .map((s) => ({ id: s.id, title: s.title, value: def.axis(s.features) }))
    .filter((s) => s.value > 0 && s.value >= threshold)
    .sort((a, b) => b.value - a.value)
}
