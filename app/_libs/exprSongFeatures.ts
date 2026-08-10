// 曲の表現特徴 (2026-08-04): analysis.json を集約して「この曲がどんな表現を求める曲か」を数値化。
// Score.exprFeatures に保存するキャッシュの計算 (A案: TS側集約・オンデマンド+バックフィル)。
// 変換表 (先生語彙⇔記号特徴) は project_karte_growth_requirements 確定6が正。
// ルバート (rit/フェルマータ) は当面対象外 — 「事実は保存・解釈は都度計算」の分担で、
// タグ判定はここの EXPR_MATCHERS が担い、曲側には生の数字だけ持たせる。
import type { SymbolSourceAnalysis } from "@/app/_libs/scoreSymbols"

/** Score.exprFeatures の中身 (0〜1の率 + 個数)。v2 (2026-08-05): 雰囲気タグ用の統計を追加 */
export type ExprFeatures = {
  v: 2 // スキーマ版数 (計算式を変えたら上げて再計算対象にする)
  notes: number // 対象音符数 (率の分母)
  slurDensity: number // スラー内の音符率
  longSlurRate: number // 4音以上の長スラー内の音符率
  staccatoDensity: number // スタッカート系音符率
  dynamicsVariety: number // 強弱記号の種類数 (p/f/mf…)
  hairpinCount: number // クレッシェンド/デクレッシェンド区間数
  lowRegisterRate: number // 低音域 (<440Hz = G/D線帯) の音符率
  vibratoTag: boolean // 曲にビブラート指示があるか
  // ── v2: 雰囲気タグ用 ──
  loudRate: number // f以上が支配する音符率 (記号を引き継いで展開)
  softRate: number // p以下が支配する音符率
  accentRate: number // アクセント付き音符率
  ornamentRate: number // 装飾音符率 (トリル/モルデント/装飾音)
  highRegisterRate: number // 高音域 (E5=659Hz以上) の音符率
  leapRate: number // 直前の音から5半音以上とぶ音符率
  rangeSemitones: number // 音域の広さ (最高音-最低音の半音数)
  keyChangeCount: number // 転調回数 (調号変更数-1)
  tempoMarkCount: number // テンポ指示の数
}

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

  const LOUD = new Set(["f", "ff", "fff", "ffff", "sf", "sfz", "fz", "rf", "rfz"])
  const SOFT = new Set(["p", "pp", "ppp", "pppp"])
  const toMidi = (hz: number) => 69 + 12 * Math.log2(hz / 440)

  let staccato = 0
  let low = 0
  let vibrato = false
  let loud = 0
  let soft = 0
  let accent = 0
  let ornament = 0
  let high = 0
  let leap = 0
  let minMidi = Infinity
  let maxMidi = -Infinity
  let prevMidi: number | null = null
  let currentDyn: string | null = null // 強弱記号は書かれた音符から次の記号まで引き継ぐ
  const dynamics = new Set<string>()
  for (const n of notes) {
    if (n.articulations?.some((a) => STACCATO_ARTS.has(a))) staccato++
    if (n.articulations?.some((a) => /accent|marcato/i.test(a))) accent++
    if (n.is_trill || n.is_mordent) ornament++
    const hz = n.pitches?.[0]
    if (typeof hz === "number" && hz > 0) {
      if (hz < 440) low++
      if (hz >= 659) high++
      const midi = toMidi(hz)
      if (prevMidi != null && Math.abs(midi - prevMidi) >= 5) leap++
      prevMidi = midi
      if (midi < minMidi) minMidi = midi
      if (midi > maxMidi) maxMidi = midi
    }
    if (n.dynamic) {
      dynamics.add(n.dynamic)
      currentDyn = n.dynamic
    }
    if (currentDyn && LOUD.has(currentDyn)) loud++
    if (currentDyn && SOFT.has(currentDyn)) soft++
    if (n.expressions?.some((e) => /vibrato/i.test(e))) vibrato = true
  }
  const graceCount = analysis.structure?.grace_note_count ?? 0

  const covered = notes.filter((n) => inSlur.has(n.note_index)).length
  const coveredLong = notes.filter((n) => inLongSlur.has(n.note_index)).length
  const r = (x: number) => Math.round((x / total) * 1000) / 1000

  return {
    v: 2,
    notes: notes.length,
    slurDensity: r(covered),
    longSlurRate: r(coveredLong),
    staccatoDensity: r(staccato),
    dynamicsVariety: dynamics.size,
    hairpinCount: (analysis.spanners?.hairpins ?? []).length,
    lowRegisterRate: r(low),
    vibratoTag: vibrato,
    loudRate: r(loud),
    softRate: r(soft),
    accentRate: r(accent),
    ornamentRate: r(ornament + graceCount),
    highRegisterRate: r(high),
    leapRate: r(leap),
    rangeSemitones: Number.isFinite(maxMidi - minMidi) ? Math.round(maxMidi - minMidi) : 0,
    keyChangeCount: Math.max(0, (analysis.structure?.key_signature_count ?? 1) - 1),
    tempoMarkCount: analysis.structure?.tempo_marks?.length ?? 0,
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
