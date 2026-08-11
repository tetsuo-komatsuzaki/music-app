/**
 * Arcoda 指板ヒートマップ セル判定・配色（仕様書 §4 準拠）
 *
 * 重要: 判定パラメータ（nMin / thetaOk / dominanceK）は仕様書 §9-B が未承認のため
 * デフォルト値を持たない。呼び出し側が承認済みの値を明示的に注入すること。
 * 提案値（未承認）: nMin=5, thetaOk=0.20, dominanceK=2.0
 *
 * 平均cents偏差の使用は禁止（§4-1）。判定は方向別ミス率のみで行う。
 */

export type CellStatus =
  | 'insufficient' // データ不足（n < nMin）
  | 'stable' // 安定
  | 'sharp' // 高方向優勢
  | 'flat' // 低方向優勢
  | 'unstable'; // 双方向不安定

export interface CellSample {
  /** 低confidence除外後のサンプル総数 */
  n: number;
  /** 高方向ミス数 */
  high: number;
  /** 低方向ミス数 */
  low: number;
}

export interface ClassifyParams {
  /** 最小サンプル数。未満はデータ不足 */
  nMin: number;
  /** 安定/不安定の境界ミス率（例 0.20 = 20%） */
  thetaOk: number;
  /** 方向優勢比（一方が他方の k 倍以上で優勢） */
  dominanceK: number;
}

/** 純関数（単体テスト対象、仕様書 §4-2 判定表の忠実な実装） */
export function classifyCell(sample: CellSample, p: ClassifyParams): CellStatus {
  if (sample.n < p.nMin) return 'insufficient';
  const rHigh = sample.high / sample.n;
  const rLow = sample.low / sample.n;
  const rMiss = rHigh + rLow;
  if (rMiss < p.thetaOk) return 'stable';
  if (rHigh >= p.dominanceK * rLow) return 'sharp';
  if (rLow >= p.dominanceK * rHigh) return 'flat';
  return 'unstable';
}

/** ミス率 → 濃度段階（0..2）。§4-2「濃度はr_missで段階変化」 */
export function intensityLevel(rMiss: number, thetaOk: number): 0 | 1 | 2 {
  if (rMiss < thetaOk * 2) return 0;
  if (rMiss < thetaOk * 3) return 1;
  return 2;
}

/** 状態×濃度 → fill色。insufficient は斜線パターン併用前提の下地色 */
export const CELL_FILLS: Record<CellStatus, readonly [string, string, string]> = {
  insufficient: ['#e8e8e8', '#e8e8e8', '#e8e8e8'],
  stable: ['#d9efd9', '#d9efd9', '#d9efd9'],
  sharp: ['#f6c9c4', '#ee9a91', '#e26a5d'],
  flat: ['#c9dcf6', '#94bdec', '#5e97dd'],
  unstable: ['#e3cdee', '#cda3e0', '#b478cf'],
};

export function cellFill(status: CellStatus, level: 0 | 1 | 2): string {
  return CELL_FILLS[status][level];
}
