// リズムパターン変種の共有型と計算 (2026-08-24)。
// "use server" ファイルからは同期関数をエクスポートできないため、
// クライアント・サーバ双方から使う純粋ロジックはここに置く。

/** 音価 (4分音符=1.0 の quarterLength)。w=全 h=2分 q=4分 e=8分 s=16分 t=32分 */
export const BASE_QL: Record<string, number> = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25, t: 0.125 }

export const RHYTHM_ARTICULATIONS = [
  "", "legato", "staccato", "spiccato", "martele", "portato", "tenuto", "accent", "tremolo", "bow_staccato",
] as const

export type RhythmNote = {
  base: string            // BASE_QL のキー
  dot?: boolean           // 1.5倍
  triplet?: boolean       // 2/3倍
  pitchNo: number         // 単位内の元音符の通し番号 (1始まり)。高さはこの番号で引き継ぐ
  articulation?: string
  slurId?: number | null  // 同じ値の連続音を1本のスラーで結ぶ
}

/** 1音の quarterLength。base が不正なら null。 */
export function noteQl(n: RhythmNote): number | null {
  const b = BASE_QL[n.base]
  if (b == null) return null
  return b * (n.dot ? 1.5 : 1) * (n.triplet ? 2 / 3 : 1)
}

/** レシピ1単位ぶんの合計 quarterLength。 */
export function totalQl(notes: RhythmNote[]): number {
  return notes.reduce((a, n) => a + (noteQl(n) ?? 0), 0)
}
