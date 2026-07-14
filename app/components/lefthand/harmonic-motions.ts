/**
 * Arcoda ナチュラル・ハーモニクス — モーション
 *
 * 【設計の核 — d の一元管理】
 * lefthand-motions.ts と同じく、シフト量 d の時系列 1 本から
 * 指・掌・胴オーバーレイのすべての座標変換を導出する。
 * ハーモニクス固有の軸は on（接触レイヤの不透明度）だけ。
 *
 * 【教則上のタイムライン】
 *   開放弦（全指浮き）→ 移動（1st→4th・途中で止まらない）→ 到着して静止
 *   → 4の指を軽く置く → 音を聴く静止 → 指を離す → 1st へ戻る → 開放弦で終わる
 *
 * ⚠️ CSS の transform は **単位必須**。translate(-34, -1.69) は無効な CSS 宣言で、
 *    宣言ごと破棄される（アニメーションが効かない）。必ず px を付けること。
 *    → 既存 lefthand-motions.ts の fingerKeyframes/handKeyframes は単位なしのため要確認。
 */

import {
  fingerTransform,
  handTransform,
  POSITIONS,
  BODY_OVERLAY_MIN_D,
} from "./lefthand-geometry";
import { contactPoint, HARMONIC_NODES, HARMONIC_COLORS, type FingerState } from "./lefthand-harmonics";

/* ============================================================
   型
   ============================================================ */
export interface HarmonicKeyframe {
  /** 0-100 (%) */
  t: number;
  /** シフト量（px）。1st = 0 */
  d: number;
  /** 接触レイヤ／注釈の不透明度（0=構え / 1=指が弦に乗っている） */
  on: number;
  ease?: "ease" | "linear";
}

export interface HarmonicMotion {
  id: string;
  label: string;
  /** 到着後に対象の指が取る状態（正: touch / 誤: press・hover） */
  state: FingerState;
  dur: number;
  keyframes: HarmonicKeyframe[];
  description: string;
}

/* ============================================================
   確定タイムライン（③ 1/2点＝4thポジション・4の指）
   ============================================================ */
export const HALF_NODE = HARMONIC_NODES.half;
export const HALF_D = POSITIONS[HALF_NODE.position].d;      // 272
export const HALF_CONTACT = contactPoint(HALF_NODE.finger, HALF_D);

const k = (t: number, d: number, on: number, ease: "ease" | "linear" = "linear"): HarmonicKeyframe =>
  ({ t, d, on, ease });

/** 移動 10%→30% / 接触 36%→41% / 静止 →62% / 離す →67% / 復路 →88% */
const TIMELINE: HarmonicKeyframe[] = [
  k(0, 0, 0),
  k(10, 0, 0, "ease"),
  k(30, HALF_D, 0),
  k(36, HALF_D, 0),
  k(41, HALF_D, 1),
  k(62, HALF_D, 1),
  k(67, HALF_D, 0, "ease"),
  k(88, 0, 0),
  k(100, 0, 0),
];

/** 胴オーバーレイの立ち上げ／落とし（出発直後・帰着直前） */
export const OVERLAY_T_OUT = 10;
export const OVERLAY_T_BACK = 88;
export const OVERLAY_RAMP = 3;

export const HARMONIC_MOTIONS: Record<string, HarmonicMotion> = {
  "half-ok": {
    id: "half-ok",
    label: "1/2点ハーモニクス（正）",
    state: "touch",
    dur: 8.0,
    keyframes: TIMELINE,
    description:
      "4thポジションへ移動し、4の指を弦の上に軽く乗せる。押し込まない。開放弦の1オクターブ上が鳴る。",
  },
  "half-press": {
    id: "half-press",
    label: "誤り：押さえすぎ",
    state: "press",
    dur: 8.0,
    keyframes: TIMELINE,
    description: "弦を指板まで押し込んでしまい、ハーモニクスではなく実音が鳴る。",
  },
};

/* ============================================================
   CSS 生成
   ⚠️ 手系と指系は同じ d から**別々の変換式**で導出される。
      1 つの keyframes を共有してはならない。
   ============================================================ */
const EASE = "cubic-bezier(0.42, 0, 0.58, 1)";

/** CSS 用に px を付ける（SVG 属性用の文字列をそのまま使うと無効になる） */
const cssTransform = (t: string) =>
  t.replace(/translate\(([-\d.]+), ([-\d.]+)\)/, (_m, a, b) => `translate(${a}px, ${b}px)`);

const timing = (f: HarmonicKeyframe) =>
  `animation-timing-function:${f.ease === "ease" ? EASE : "linear"};`;

const block = (m: HarmonicMotion, decl: (f: HarmonicKeyframe) => string) =>
  m.keyframes.map((f) => `  ${f.t}% { ${decl(f)} ${timing(f)} }`).join("\n");

export const fingerKeyframes = (m: HarmonicMotion) =>
  block(m, (f) => `transform:${cssTransform(fingerTransform(f.d))};`);

export const handKeyframes = (m: HarmonicMotion) =>
  block(m, (f) => `transform:${cssTransform(handTransform(f.d))};`);

/** 構えレイヤ（全指浮き） */
export const baseOpacityKeyframes = (m: HarmonicMotion) => block(m, (f) => `opacity:${1 - f.on};`);
/** 接触レイヤ＋注釈 */
export const onOpacityKeyframes = (m: HarmonicMotion) => block(m, (f) => `opacity:${f.on};`);

export function overlayOpacityKeyframes(m: HarmonicMotion): string {
  const dMax = Math.max(...m.keyframes.map((f) => f.d));
  if (dMax < BODY_OVERLAY_MIN_D) return "  0% { opacity:0; }\n  100% { opacity:0; }";
  return [
    `  0% { opacity:0; animation-timing-function:linear; }`,
    `  ${OVERLAY_T_OUT}% { opacity:0; animation-timing-function:linear; }`,
    `  ${OVERLAY_T_OUT + OVERLAY_RAMP}% { opacity:1; animation-timing-function:linear; }`,
    `  ${OVERLAY_T_BACK - OVERLAY_RAMP}% { opacity:1; animation-timing-function:linear; }`,
    `  ${OVERLAY_T_BACK}% { opacity:0; animation-timing-function:linear; }`,
    `  100% { opacity:0; }`,
  ].join("\n");
}

/**
 * 1 つのモーションに必要な CSS 全体を生成する。
 * @param uid useId() 等で得た一意な識別子
 */
export function harmonicCSS(m: HarmonicMotion, uid: string): string {
  const anim = (name: string) => `${name}-${uid} ${m.dur}s linear infinite`;
  const p = HALF_CONTACT;
  return `
@keyframes hm-finger-${uid} {
${fingerKeyframes(m)}
}
@keyframes hm-hand-${uid} {
${handKeyframes(m)}
}
@keyframes hm-base-op-${uid} {
${baseOpacityKeyframes(m)}
}
@keyframes hm-on-op-${uid} {
${onOpacityKeyframes(m)}
}
@keyframes hm-overlay-op-${uid} {
${overlayOpacityKeyframes(m)}
}
@keyframes hm-ripple-${uid} {
  0%,41% { opacity:.9; transform:scale(1); animation-timing-function:${EASE}; }
  55%    { opacity:0;  transform:scale(2.6); animation-timing-function:linear; }
  100%   { opacity:0;  transform:scale(2.6); }
}

.hm-${uid} .hm-fingers  { animation: ${anim("hm-finger")}; }
.hm-${uid} .hm-f-base   { animation: ${anim("hm-base-op")}; }
.hm-${uid} .hm-f-on     { animation: ${anim("hm-on-op")}; }
.hm-${uid} .hm-hand     { animation: ${anim("hm-hand")}; }
.hm-${uid} .hm-overlay  { animation: ${anim("hm-overlay-op")}; }
.hm-${uid} .hm-mark     { animation: ${anim("hm-on-op")}; }
.hm-${uid} .hm-ripple   { animation: ${anim("hm-ripple")}; transform-origin:${p.x}px ${p.y}px; }

.hm-${uid}.is-paused * { animation-play-state: paused !important; }

/* 停止時は「到着して指を置いた状態」の静止画として正しく見える */
@media (prefers-reduced-motion: reduce) {
  .hm-${uid} * { animation: none !important; }
  .hm-${uid} .hm-fingers { transform:${cssTransform(fingerTransform(HALF_D))}; }
  .hm-${uid} .hm-hand    { transform:${cssTransform(handTransform(HALF_D))}; }
  .hm-${uid} .hm-f-base  { opacity:0; }
  .hm-${uid} .hm-f-on    { opacity:1; }
  .hm-${uid} .hm-overlay { opacity:1; }
  .hm-${uid} .hm-mark    { opacity:1; }
  .hm-${uid} .hm-ripple  { opacity:0; }
}
`.trim();
}

export const RING_COLOR = HARMONIC_COLORS.ring;
export const BAD_COLOR = HARMONIC_COLORS.bad;
