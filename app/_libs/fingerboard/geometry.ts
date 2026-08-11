/**
 * Arcoda 指板ヒートマップ ジオメトリ（単一ソース）
 *
 * 全座標は以下の確定パラメータから機械導出する。手書き座標の追加は禁止。
 * Python版ジェネレータ gen_fingerboard.py と完全同一式（パリティ検証済み 2026-08-11）。
 *
 * 確定パラメータ（実物標準寸法・参照画像で構造確認済み 2026-08-11）:
 * - L0 = 328mm: 弦長 ナット→駒（実物標準）
 * - N_END = 30: 指板端の半音位置（y(30)=270.017mm ≒ 実物指板長270mm）
 * - W_NUT = 24mm / W_END = 42mm: ナット幅・指板端幅（実物標準、参照画像比1.76で確認）
 * - 弦カラム = 幅の均等4分割
 * - 弦順 = G D A E（左→右）
 * - 開放弦帯 = ナット上部、高さ y(1) = 18.409mm
 *
 * 単位: mm（SVG user unit と 1:1）
 */

export const L0 = 328.0;
export const N_END = 30;
export const W_NUT = 24.0;
export const W_END = 42.0;

export const STRINGS = ['G', 'D', 'A', 'E'] as const;
export type ViolinString = (typeof STRINGS)[number];

/** ナットからの距離 [mm]。n は半音位置（実数可） */
export function yOf(n: number): number {
  return L0 * (1 - Math.pow(2, -n / 12));
}

/** 指板端のy座標 */
export const Y_END = yOf(N_END);

/** 開放弦帯の高さ（= 第1半音セル高） */
export const H_OPEN = yOf(1);

/** 位置 y での指板半幅（ナット→指板端で線形、開放帯へは線形外挿） */
export function halfWidthAt(y: number): number {
  return W_NUT / 2 + (W_END / 2 - W_NUT / 2) * (y / Y_END);
}

/** 位置 y でのカラム境界x。k = 0..4（0=左縁, 4=右縁）。中心線 x=0 */
export function colX(y: number, k: number): number {
  const w = 2 * halfWidthAt(y);
  return -w / 2 + (w * k) / 4;
}

export type Point = readonly [number, number];

/**
 * セルポリゴン（時計回り4点）。
 * n = 0: 開放弦帯（y ∈ [-H_OPEN, 0]）
 * n = 1..N_END: 線 n-1 〜 線 n
 */
export function cellPolygon(stringIndex: number, n: number): Point[] {
  const yTop = n === 0 ? -H_OPEN : yOf(n - 1);
  const yBot = n === 0 ? 0 : yOf(n);
  return [
    [colX(yTop, stringIndex), yTop],
    [colX(yTop, stringIndex + 1), yTop],
    [colX(yBot, stringIndex + 1), yBot],
    [colX(yBot, stringIndex), yBot],
  ];
}

/** セル中心点（タップ判定・ラベル配置用） */
export function cellCenter(stringIndex: number, n: number): Point {
  const p = cellPolygon(stringIndex, n);
  const cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4;
  const cy = (p[0][1] + p[2][1]) / 2;
  return [cx, cy];
}

/** セルID規約: cell-{弦}-{半音2桁}（SVGアセットと同一） */
export function cellId(s: ViolinString, n: number): string {
  return `cell-${s}-${String(n).padStart(2, '0')}`;
}

/** viewBox（SVGアセットと同一値） */
export const VIEW_BOX = { x: -29, y: -36, width: 58, height: 312 } as const;

/** 全セルの列挙（描画・集計の走査用）: 4弦 × (開放 + 30半音) = 124 */
export function allCells(): { s: ViolinString; stringIndex: number; n: number }[] {
  const out: { s: ViolinString; stringIndex: number; n: number }[] = [];
  for (let n = 0; n <= N_END; n++) {
    STRINGS.forEach((s, stringIndex) => out.push({ s, stringIndex, n }));
  }
  return out;
}
