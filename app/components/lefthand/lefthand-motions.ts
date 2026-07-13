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
 *
 * 【教則上のタイムライン】
 *   開放弦（全指浮き） → 1の指を押弦 → 静止して確認 → 移動（途中で止まらない）
 *   → 到着して静止（耳で確認する間） → 1st へ戻る → 指を離す
 * ループの継ぎ目が跳ばないよう、必ず開放弦の状態に戻して終わる。
 */

import {
  fingerTransform,
  handTransform,
  POSITIONS,
  BODY_OVERLAY_MIN_D,
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
  /** 1の指が弦を押さえているか（0=浮かせ / 1=押弦）。中間値はクロスフェード */
  press: number;
  /**
   * 親指がネック裏に回っているか（0=手前・1=裏）。
   * 中間値は持ち替えのクロスフェードを表す。
   */
  behind: number;
  /** イージング（この点から次の点までの区間に適用） */
  ease?: "ease" | "linear";
}

export interface PositionShift {
  id: string;
  label: string;
  /** 最終的に到達するポジション */
  target: PositionId;
  /** 経由するポジション（6th は 5th を経由する） */
  via?: PositionId;
  /** 1 ループの長さ（秒） */
  dur: number;
  keyframes: ShiftKeyframe[];
  /** 親指の持ち替えを伴うか（5th/6th） */
  hasThumbSwitch: boolean;
  /** ネック裏形状を描くときの d（手は動かないが指は d で動く） */
  behindHandD: number;
  description: string;
}

const D = (p: PositionId) => POSITIONS[p].d;

const k = (
  t: number,
  d: number,
  press: number,
  behind = 0,
  ease: "ease" | "linear" = "linear",
): ShiftKeyframe => ({ t, d, press, behind, ease });

/* ============================================================
   移動の確定データ

   ⚠️ 持ち替え（親指がネック裏へ回る）は、移動の**終盤**で行う。
      早すぎると、4th の位置にいる時点で正しい手形が消えてしまう。
      往路は移動距離の 72%〜100%、復路は 0%〜28% の区間に割り当てる。
   ============================================================ */

/** 単一移動（1st → 目標）の共通タイムライン */
function simpleShift(
  target: PositionId,
  label: string,
  description: string,
  hasThumbSwitch = false,
): PositionShift {
  const d = D(target);
  // 移動: 32%→47%（往路） / 68%→83%（復路）
  // 持ち替え窓: 往路 42.8%→47%、復路 68%→72.2%
  const kf: ShiftKeyframe[] = hasThumbSwitch
    ? [
        k(0, 0, 0),
        k(14, 0, 0),
        k(19, 0, 1),
        k(32, 0, 1, 0, "ease"),
        k(42.8, d * 0.72, 1, 0, "ease"),
        k(47, d, 1, 1),
        k(68, d, 1, 1, "ease"),
        k(72.2, d * 0.72, 1, 0, "ease"),
        k(83, 0, 1),
        k(90, 0, 0),
        k(100, 0, 0),
      ]
    : [
        k(0, 0, 0),
        k(14, 0, 0),
        k(19, 0, 1, 0, "ease"),
        k(32, 0, 1, 0, "ease"),
        k(47, d, 1),
        k(68, d, 1, 0, "ease"),
        k(83, 0, 1),
        k(90, 0, 0),
        k(100, 0, 0),
      ];
  return {
    id: `1st-${target}`,
    label,
    target,
    dur: hasThumbSwitch ? 6.5 : 6.0,
    hasThumbSwitch,
    behindHandD: d,
    description,
    keyframes: kf,
  };
}

export const POSITION_SHIFTS: Record<string, PositionShift> = {
  "1st-2nd": simpleShift(
    "2nd",
    "1st → 2nd",
    "指幅1本分（68px）右へスライド。親指もネックに沿って同時に移動する。",
  ),
  "1st-3rd": simpleShift(
    "3rd",
    "1st → 3rd",
    "掌が胴に達するため、胴が掌の手前に来る（胴オーバーレイ）。",
  ),
  "1st-4th": simpleShift("4th", "1st → 4th", "手が胴に深く回り込む。"),
  "1st-5th": simpleShift(
    "5th",
    "1st → 5th",
    "移動の終盤で親指がネックの裏へ回る（持ち替え）。ハイポジションの要。",
    true,
  ),

  /** 6th は 5th を経由する（5th → 6th では手は動かず、指だけが先へ伸びる） */
  "1st-5th-6th": {
    id: "1st-5th-6th",
    label: "1st → 5th → 6th",
    target: "6th",
    via: "5th",
    dur: 9.0,
    hasThumbSwitch: true,
    behindHandD: D("5th"), // 手はネック裏形状のまま動かない
    description:
      "まず 5th へ移動して持ち替え、そこから指だけを 6th へ伸ばす。手は動かさない。",
    keyframes: [
      k(0, 0, 0),
      k(10, 0, 0),
      k(14, 0, 1),
      k(24, 0, 1, 0, "ease"),
      k(34.8, D("5th") * 0.72, 1, 0, "ease"),
      k(39, D("5th"), 1, 1),
      k(50, D("5th"), 1, 1, "ease"),
      k(58, D("6th"), 1, 1),
      k(74, D("6th"), 1, 1, "ease"),
      k(78, D("5th") * 0.98, 1, 1, "ease"),
      k(79.9, D("5th") * 0.72, 1, 0, "ease"),
      k(88, 0, 1),
      k(94, 0, 0),
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

const EASE = "cubic-bezier(0.42, 0, 0.58, 1)";
const LINEAR = "linear";

/** 各キーフレームに個別のイージングを付ける（CSS の animation-timing-function は
 *  keyframe セレクタ内に書くと「その点から次の点まで」に適用される） */
const timing = (f: ShiftKeyframe) =>
  `animation-timing-function: ${f.ease === "ease" ? EASE : LINEAR};`;

const kfBlock = (shift: PositionShift, decl: (f: ShiftKeyframe) => string) =>
  shift.keyframes
    .map((f) => `  ${f.t}% { ${decl(f)} ${timing(f)} }`)
    .join("\n");

// CSS の translate は単位必須(unitless の translate(-34,-1.69) は無効化される)。
// fingerTransform/handTransform は SVG属性用に unitless を返すので、CSSキーフレーム用に
// px を付ける。新コンポーネントは animated 時に内側 transform を出さない(二重変換なし)ため、
// ここは絶対値のまま px 化すればよい (2026-07-13 統合時の互換対応)。
const withPx = (t: string) => t.replace(/(-?\d[\d.]*)/g, "$1px");

/** 指系（指塊・爪・指しわ） */
export const fingerKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `transform: ${withPx(fingerTransform(f.d))};`);

/** 手系（掌・親指・前腕・手しわ） */
export const handKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `transform: ${withPx(handTransform(f.d))};`);

/** 通常形状の手の不透明度（持ち替え時にフェードアウト） */
export const handFrontOpacityKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `opacity: ${1 - f.behind};`);

/** ネック裏形状の手の不透明度（持ち替え時にフェードイン） */
export const handBehindOpacityKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `opacity: ${f.behind};`);

/** 開放弦（全指浮き）レイヤの不透明度 */
export const fingersOpenOpacityKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `opacity: ${1 - f.press};`);

/** 押弦レイヤの不透明度 */
export const fingersPressOpacityKeyframes = (s: PositionShift) =>
  kfBlock(s, (f) => `opacity: ${f.press};`);

/**
 * 胴オーバーレイの不透明度。
 *
 * ⚠️ 常時表示すると、1st 位置にある前腕を覆ってしまう（元絵の 1st/2nd には胴オーバーレイがない）。
 * ⚠️ かつ、ネック裏の手形が現れる**前に**不透明化を完了していなければ、掌が胴から透ける。
 *    そのため d のしきい値ではなく「移動を開始したら即座に立ち上げる」形にしてある。
 */
export function overlayOpacityKeyframes(s: PositionShift): string {
  const kfs = s.keyframes;
  const dMax = Math.max(...kfs.map((f) => f.d));
  if (dMax < BODY_OVERLAY_MIN_D) return "  0% { opacity: 0; }\n  100% { opacity: 0; }";

  // 出発（最後に d=0 だった点）と帰着（再び d=0 に戻る点）を keyframes から導く
  const iOut = kfs.reduce((acc, f, i) => (f.d === 0 && i < kfs.length / 2 ? i : acc), 0);
  const iBack = kfs.findIndex((f, i) => f.d === 0 && i > kfs.length / 2);
  const tOut = kfs[iOut].t;
  const tBack = kfs[iBack].t;
  const ramp = 3; // 出発直後の 3% で不透明化しきる（持ち替えより十分手前）

  return [
    `  0% { opacity: 0; ${LINEAR ? "animation-timing-function: linear;" : ""} }`,
    `  ${tOut}% { opacity: 0; animation-timing-function: linear; }`,
    `  ${tOut + ramp}% { opacity: 1; animation-timing-function: linear; }`,
    `  ${tBack - ramp}% { opacity: 1; animation-timing-function: linear; }`,
    `  ${tBack}% { opacity: 0; animation-timing-function: linear; }`,
    `  100% { opacity: 0; }`,
  ].join("\n");
}

/**
 * 1 つのモーションに必要な CSS 全体を生成する。
 * @param uid useId() 等で得た一意な識別子（同一ページに複数配置する場合の衝突回避）
 */
export function shiftCSS(shift: PositionShift, uid: string): string {
  const anim = (name: string) => `${name}-${uid} ${shift.dur}s linear infinite`;
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
@keyframes lh-fingers-open-op-${uid} {
${fingersOpenOpacityKeyframes(shift)}
}
@keyframes lh-fingers-press-op-${uid} {
${fingersPressOpacityKeyframes(shift)}
}
@keyframes lh-overlay-op-${uid} {
${overlayOpacityKeyframes(shift)}
}

.lh-${uid} .lh-fingers        { animation: ${anim("lh-finger")}; }
.lh-${uid} .lh-fingers-open   { animation: ${anim("lh-fingers-open-op")}; }
.lh-${uid} .lh-fingers-press  { animation: ${anim("lh-fingers-press-op")}; }
.lh-${uid} .lh-hand           { animation: ${anim("lh-hand")}; }
.lh-${uid} .lh-hand-front     { animation: ${anim("lh-hand")}, ${anim("lh-hand-front-op")}; }
.lh-${uid} .lh-hand-behind    { animation: ${anim("lh-hand-behind-op")}; }
.lh-${uid} .lh-overlay        { animation: ${anim("lh-overlay-op")}; }

/* 停止状態では 1st ポジション・開放弦の静止画として正しく表示される */
.lh-${uid}.is-paused * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .lh-${uid} * { animation: none !important; }
}
`.trim();
}
