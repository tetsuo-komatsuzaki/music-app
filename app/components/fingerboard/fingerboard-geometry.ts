/**
 * Arcoda 指板俯瞰図 — 幾何・色（確定値）
 *
 * 【半音位置は実弦長比】
 *   距離(n) = K × (1 − 2^(−n/12))
 * Cメジャーの全音・半音が距離に正確に出る（A線・検証値）:
 *   ラ→シ(全音)=125px / シ→ド(半音)=57px / ド→レ(全音)=105px
 *   レ→ミ(全音)=94px / ミ→ファ(半音)=43px / ファ→ソ(全音)=79px
 * 全音 ≈ 半音の2倍、ハイポジションほど詰まる（実際の指板と同じ）。
 * ⚠️ 等間隔に「整えて」はならない。
 */

export type StringName = "G" | "D" | "A" | "E";

export const OPEN_MIDI: Record<StringName, number> = { G: 55, D: 62, A: 69, E: 76 };
export const STRING_ORDER: StringName[] = ["G", "D", "A", "E"];
export const STRING_WIDTH: Record<StringName, number> = { G: 3.4, D: 2.9, A: 2.4, E: 1.9 };

export const K = 1150;
export const dist = (n: number) => K * (1 - 2 ** (-n / 12));

/** 縦型（重音レッスン用）: ナット上・弦は左から G D A E */
export const V_STR: Record<StringName, number> = { G: 130, D: 200, A: 270, E: 340 };
export const V_NUT = 120;
/** 横長（それ以外）: ナット左・弦は上から E A D G（仕様書の正面図と同じ並び） */
export const H_STR: Record<StringName, number> = { E: 130, A: 200, D: 270, G: 340 };
export const H_NUT = 130;

/**
 * ポジション区間ごとの丸の色。**移動のたびに切り替える**（監修指定 2026-07-14）。
 * [0] 開始位置 / [1] 1回目の移動後 / [2] 2回目の移動後
 */
export const SEG_COLORS = ["#14A6A0", "#E0762E", "#8E5BB8"] as const;

/** マーカーの寸法（監修済みの見やすさ調整。縮めてはならない） */
export const DOT_R = 28;          // 押弦の丸
export const DOT_FONT = 37;       // 指番号
export const PILL_FONT = 31;      // 音名バッジ
export const OPEN_R = 21;         // 開放弦リング

export class Geo {
  readonly h: boolean;
  readonly W: number;
  readonly H: number;
  constructor(horizontal: boolean) {
    this.h = horizontal;
    this.W = horizontal ? 1000 : 470;
    this.H = horizontal ? 470 : 1000;
  }
  pos(s: StringName, off: number): [number, number] {
    const d = Math.round(dist(off) * 10) / 10;
    return this.h ? [H_NUT + d, H_STR[s]] : [V_STR[s], V_NUT + d];
  }
  openPos(s: StringName): [number, number] {
    return this.h ? [H_NUT - 22, H_STR[s]] : [V_STR[s], V_NUT - 22];
  }
}
