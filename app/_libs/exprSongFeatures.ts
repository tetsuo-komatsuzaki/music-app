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

// ── 変換表: 先生語彙 → 曲スコア (0〜1) ────────────────────
// tempo は Score.defaultTempo (null なら中庸90扱い)
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

export const EXPR_MATCHERS: Record<string, (f: ExprFeatures, tempo: number | null) => number> = {
  // レガート歌わせ ⇔ スラー密度 高 × 低中テンポ
  expr_legato_singing: (f, tempo) => {
    const t = tempo ?? 90
    const tempoFit = t <= 100 ? 1 : clamp01(1 - (t - 100) / 60)
    return clamp01(f.slurDensity * 1.4) * 0.75 + tempoFit * 0.25
  },
  // 歯切れ ⇔ スタッカート密度
  expr_articulation: (f) => clamp01(f.staccatoDensity * 3),
  // 強弱の起伏 ⇔ 強弱記号の種類数 + ヘアピン
  expr_dynamics: (f) => clamp01(f.dynamicsVariety / 4) * 0.7 + clamp01(f.hairpinCount / 4) * 0.3,
  // フレーズ呼吸 ⇔ 長スラー
  expr_phrasing: (f) => clamp01(f.longSlurRate * 1.8),
  // 音の深み ⇔ 低音域 × ロングトーン
  expr_tone_depth: (f) => clamp01(f.lowRegisterRate * 1.2) * 0.6 + clamp01(f.longToneRate * 2.5) * 0.4,
  // ビブラート表情 ⇔ ロングトーン率 (伸ばす音がないとかけられない)
  expr_vibrato: (f) => clamp01(f.longToneRate * 2.5),
  // ルバート ⇔ rit/フェルマータ — 原料未抽出のため当面対象外 (呼び手は undefined を「準備中」扱い)
}

/** 「合う」と言ってよい最低スコア (これ未満の曲しか無ければ正直に出さない) */
export const EXPR_MATCH_MIN = 0.45

/** 曲リストから表現タグに合う順に並べる (score降順・最低ライン未満は落とす) */
export function rankSongsForExpr(
  tagId: string,
  songs: Array<{ id: string; title: string; features: ExprFeatures; tempo: number | null }>,
): Array<{ id: string; title: string; score: number }> {
  const matcher = EXPR_MATCHERS[tagId]
  if (!matcher) return []
  return songs
    .map((s) => ({ id: s.id, title: s.title, score: matcher(s.features, s.tempo) }))
    .filter((s) => s.score >= EXPR_MATCH_MIN)
    .sort((a, b) => b.score - a.score)
}
