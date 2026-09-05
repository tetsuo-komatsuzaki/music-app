// 変種(Variant)の軸の定数 (2026-07-18 Phase B)。prisma 非依存＝クライアントからも import 可。
// 難易度: 曲/エチュードの変種軸 (Difficulty enum と id 一致)。
// 奏法: 基礎練の変種軸 (articulation 文字列)。

export const DIFFICULTIES = [
  { id: "BEGINNER", label: "初級" },
  { id: "INTERMEDIATE", label: "中級" },
  { id: "ADVANCED", label: "上級" },
] as const

export type DifficultyId = (typeof DIFFICULTIES)[number]["id"]
const DIFFICULTY_IDS: readonly string[] = DIFFICULTIES.map((d) => d.id)
export function isDifficulty(v: string): v is DifficultyId {
  return DIFFICULTY_IDS.includes(v)
}

export const ARTICULATIONS = [
  { id: "legato", label: "レガート" },
  { id: "staccato", label: "スタッカート" },
  { id: "martele", label: "マルテレ" },
  { id: "slur", label: "スラー" },
  { id: "spiccato", label: "スピッカート" },
  { id: "portato", label: "ポルタート" },
  // 2026-09-01: テヌートを追加。教材が8件あるのに選択用のこのリストに無く、
  // 練習前シートから選べなかった (トレモロと同じ穴)。
  { id: "tenuto", label: "テヌート" },
  // 2026-08-25: トレモロを追加。生成側 (articulationPatterns.STANDARD_ARTICULATIONS) には
  // 元から存在し、音階72件・アルペジオ24件が実在していたのに、選択用のこのリストに無いため
  // 練習前シートに選択肢が出ず、96件が到達不能になっていた。
  { id: "tremolo", label: "トレモロ" },
  // 2026-09-05 Tetsuo: サルタート = 選んだ音符をすべてスラーでつなぎ、スタッカートの点を付ける (スラーの下に点)。
  // 記譜は「スラー + スタッカート」だが奏法としては別物。生成側 (_ART_CLS "saltato") と揃える
  { id: "saltato", label: "サルタート" },
] as const

export type ArticulationId = (typeof ARTICULATIONS)[number]["id"]
const ARTICULATION_IDS: readonly string[] = ARTICULATIONS.map((a) => a.id)
export function isArticulation(v: string): v is ArticulationId {
  return ARTICULATION_IDS.includes(v)
}

/** 難易度軸を使うカテゴリ (曲・エチュード) */
export function usesDifficulty(category: string): boolean {
  return category === "score" || category === "etude"
}
/** 奏法軸を使うカテゴリ (基礎練 = 曲/エチュード以外) */
export function usesArticulation(category: string): boolean {
  return !usesDifficulty(category) && category !== "lesson"
}
