/**
 * Arcoda 左手ポジション移動モーション
 *
 * 【設計の核 — d の一元管理】
 * ポジション移動を「シフト量 d の時系列」という 1 つの数値で定義する。
 * d だけから指・掌・胴オーバーレイのすべての座標変換が導出されるため、
 * 各パーツは構造的に同期する。
 *
 * > パーツごとに動きを作り込んではならない。破綻の原因になる。
 *
 * （運弓仕様 §9-1 の「h の一元管理」と同じ設計）
 */

import {
  POSITIONS,
  STRING_SLOPE,
  NECK_SLOPE,
  type PositionId,
} from "./lefthand-geometry";

/* ============================================================
   型定義
   ============================================================ */

export interface ShiftKeyframe {
  /** 0-100 (%) */
  t: number;
  /** シフト量（px）。1st = 0 */
  d: number;
  /**
   * 親指がネック裏に回っているか（0=手前・1=裏）。
   * 0/1 の間の値は持ち替え中のクロスフェードを表す。
   */
  behind: number;
}

export interface PositionShift {
  id: string;
  label: string;
  /** 到達するポジション */
  target: PositionId;
  /** 1 ループの長さ（秒） */
  dur: number;
  keyframes: ShiftKeyframe[];
  /** 親指の持ち替えを伴うか（5th/6th） */
  hasThumbSwitch: boolean;
  /** 教材上の説明 */
  description: string;
}

const k = (t: number, d: number, behind = 0): ShiftKeyframe => ({ t, d, behind });

/* ============================================================
   移動の確定データ

   タイムライン設計:
     0-30%   スライド（イージングあり）
     30-40%  親指の持ち替え（5th/6th のみ）
     40-72%  到達状態で静止（学習者が形を観察する時間）
     72-95%  1st へ戻る
     95-100% 静止
   ============================================================ */

const D = (p: PositionId) => POSITIONS[p].d;

export const POSITION_SHIFTS: Record<string, PositionShift> = {
  "1st-2nd": {
    id: "1st-2nd",
    label: "1st → 2nd",
    target: "2nd",
    dur: 1.8,
    hasThumbSwitch: false,
    description: "指幅1本分（68px）右へスライド。親指もネックに沿って同時に移動する。",
    keyframes: [k(0, 0), k(35, D("2nd")), k(60, D("2nd")), k(95, 0), k(100, 0)],
  },
  "1st-3rd": {
    id: "1st-3rd",
    label: "1st → 3rd",
    target: "3rd",
    dur: 1.8,
    hasThumbSwitch: false,
    description: "掌が胴に達するため、胴が掌の手前に来る（胴オーバーレイ）。",
    keyframes: [k(0, 0), k(35, D("3rd")), k(60, D("3rd")), k(95, 0), k(100, 0)],
  },
  "1st-4th": {
    id: "1st-4th",
    label: "1st → 4th",
    target: "4th",
    dur: 1.8,
    hasThumbSwitch: false,
    description: "手が胴に深く回り込む。",
    keyframes: [k(0, 0), k(35, D("4th")), k(60, D("4th")), k(95, 0), k(100, 0)],
  },
  "1st-5th": {
    id: "1st-5th",
    label: "1st → 5th",
    target: "5th",
    dur: 2.4,
    hasThumbSwitch: true,
    description:
      "スライドの到達時に、親指がネックの裏へ回る（持ち替え）。ハイポジションの要。",
    keyframes: [
      k(0, 0, 0),
      k(30, D("5th"), 0),
      k(40, D("5th"), 1), // 持ち替え
      k(72, D("5th"), 1),
      k(80, D("5th"), 0),
      k(95, 0, 0),
      k(100, 0, 0),
    ],
  },
  "1st-6th": {
    id: "1st-6th",
    label: "1st → 6th",
    target: "6th",
    dur: 2.4,
    hasThumbSwitch: true,
    description: "5th と同じ持ち替えを行い、指はさらに指幅0.75本分先へ進む。",
    keyframes: [
      k(0, 0, 0),
      k(30, D("6th"), 0),
      k(40, D("6th"), 1),
      k(72, D("6th"), 1),
      k(80, D("6th"), 0),
      k(95, 0, 0),
      k(100, 0, 0),
    ],
  },
};

export function getShift(id: string): PositionShift | undefined {
  return POSITION_SHIFTS[id];
}

/* ============================================================
   CSS 生成

   ⚠️ 手系と指系は、同じ d から**別々の変換式**で導出される。
      1 つの keyframes を共有してはならない。
   ============================================================ */

const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

// CSS アニメの transform は「d=0 基準からのデルタ」で出す。
//   - 子要素(指塊/手パス)は既に fingerTransform(0)/handTransform(0) の位置に描かれている
//     ため、g 側は 0→d の差分だけ動かせばよい(絶対値を足すと基準が二重に効いて破綻する)。
//   - CSS の translate は単位必須。unitless(例 translate(68,3.4))は無効化されるので px を付ける。
// (SVG属性用の fingerTransform/handTransform は unitless のままで正しい)
const px2 = (v: number) => Math.round(v * 100) / 100;

/** 指系（指塊・爪・指しわ）の keyframes */
export function fingerKeyframes(shift: PositionShift): string {
  return shift.keyframes
    .map((f) => `${f.t}% { transform: translate(${f.d}px, ${px2(f.d * STRING_SLOPE)}px); }`)
    .join("\n  ");
}

/** 手系（掌・親指・前腕・手しわ）の keyframes */
export function handKeyframes(shift: PositionShift): string {
  return shift.keyframes
    .map((f) => `${f.t}% { transform: translate(${f.d}px, ${px2(f.d * NECK_SLOPE)}px); }`)
    .join("\n  ");
}

/** 通常形状の手の不透明度（持ち替え時にフェードアウト） */
export function handFrontOpacityKeyframes(shift: PositionShift): string {
  return shift.keyframes
    .map((f) => `${f.t}% { opacity: ${1 - f.behind}; }`)
    .join("\n  ");
}

/** ネック裏形状の手の不透明度（持ち替え時にフェードイン） */
export function handBehindOpacityKeyframes(shift: PositionShift): string {
  return shift.keyframes
    .map((f) => `${f.t}% { opacity: ${f.behind}; }`)
    .join("\n  ");
}

/**
 * 胴オーバーレイの不透明度。
 *
 * ⚠️ 常時表示すると、1st 位置にある前腕を覆ってしまう。
 *    手が胴の領域に入ってから現れるようアニメーションさせること。
 */
export function overlayOpacityKeyframes(shift: PositionShift): string {
  const threshold = 100; // d がこれ未満なら手はまだ胴に達していない
  return shift.keyframes
    .map((f) => `${f.t}% { opacity: ${f.d >= threshold ? 1 : 0}; }`)
    .join("\n  ");
}

/**
 * 1 つのモーションに必要な CSS 全体を生成する。
 * @param uid useId() 等で得た一意な識別子（同一ページに複数配置する場合の衝突回避）
 */
export function shiftCSS(shift: PositionShift, uid: string): string {
  const dur = `${shift.dur}s`;
  const common = `${dur} ${EASE} infinite`;
  return `
@keyframes lh-finger-${uid} {
  ${fingerKeyframes(shift)}
}
@keyframes lh-hand-${uid} {
  ${handKeyframes(shift)}
}
@keyframes lh-hand-front-op-${uid} {
  ${handFrontOpacityKeyframes(shift)}
}
@keyframes lh-hand-behind-op-${uid} {
  ${handBehindOpacityKeyframes(shift)}
}
@keyframes lh-overlay-op-${uid} {
  ${overlayOpacityKeyframes(shift)}
}

.lh-${uid} .lh-fingers { animation: lh-finger-${uid} ${common}; }
.lh-${uid} .lh-hand    { animation: lh-hand-${uid} ${common}; }
.lh-${uid} .lh-hand-front  { animation: lh-hand-${uid} ${common}, lh-hand-front-op-${uid} ${common}; }
.lh-${uid} .lh-hand-behind { animation: lh-hand-behind-op-${uid} ${common}; }
.lh-${uid} .lh-overlay { animation: lh-overlay-op-${uid} ${common}; }

/* 停止状態では 1st ポジションの静止画として正しく表示される */
.lh-${uid}.is-paused * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .lh-${uid} * { animation: none !important; }
}
`.trim();
}
