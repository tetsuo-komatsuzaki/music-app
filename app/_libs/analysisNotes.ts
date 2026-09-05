/**
 * analysisNotes.ts — analysis.json の音符列を「記譜の 1 回目だけ」に絞る (2026-09-05 Tetsuo報告: カイザーNo.16 が1小節24音)。
 *
 * 解析データは演奏順で、繰り返しを展開して並ぶ。各音は記譜上の小節番号 (measure_number) を持つので、
 * 繰り返しの中の小節を小節番号で束ねると 2 回分 (12音→24音) に見える。
 * 教材管理のダイアログ (奏法・リズムのバリエーション作成) は「記譜の形」を知りたいだけなので、
 * 小節番号が前の音より小さくなった時点 (繰り返しで戻った) 以降、すでに見た小節の音を飛ばす。
 * 解析データそのものは演奏順として正しいので変えない。
 */
export type AnalysisNoteLike = { type?: string; measure_number?: number }

export function firstPassNotes<T extends AnalysisNoteLike>(notes: T[]): T[] {
  const closed = new Set<number>()   // 一度離れた小節 (以後この小節の音は繰り返しの 2 回目以降)
  let current: number | null = null
  const out: T[] = []
  for (const n of notes) {
    const m = n.measure_number
    if (typeof m !== "number") { out.push(n); continue }
    if (m !== current) {
      if (current !== null) closed.add(current)
      current = m
    }
    if (closed.has(m)) continue
    out.push(n)
  }
  return out
}
