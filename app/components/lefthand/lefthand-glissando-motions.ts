/**
 * Arcoda 左手 — グリッサンドのモーション
 *
 * 【設計の核 — d の一元管理（ポジション移動と同じ）】
 * グリッサンドは「d を連続変化させる」だけ。指は押さえたまま離さない。
 *
 * ポジション移動との違いは 2 点:
 *   1. 移動中も指を押さえ続ける（開放弦フェーズを持たない）
 *   2. d が「点から点へ」ではなく連続なので、手形の持ち替えと胴オーバーレイを
 *      **キーフレームではなく d から直接導出する**（behindNeckAt / bodyOverlayAt）
 *
 * ⚠️ 速度プロファイルを変えても破綻しないのは、この導出のおかげ。
 *    持ち替えや胴オーバーレイのタイミングを時間で直書きしてはならない。
 */

import {
  POSITIONS,
  fingerTransform,
  handTransform,
  behindNeckAt,
  bodyOverlayAt,
  type PositionId,
} from "./lefthand-geometry";

/* ============================================================
   型定義
   ============================================================ */

/**
 * 滑走区間の速度プロファイル。
 * 「時間をどう配分し、そのあいだに距離をどれだけ進むか」の対で表す。
 * 合計はどちらも 1。
 *
 * ⚠️ distance は必ず単調に消費すること（負の値を入れると逆走する）。
 */
export interface SpeedSegment {
  /** この区間が滑走時間に占める割合 */
  time: number;
  /** この区間で消化する移動距離の割合 */
  distance: number;
}

export type GlissandoSpeedId = "even" | "fast" | "uneven";

export interface GlissandoDef {
  id: string;
  label: string;
  from: PositionId;
  to: PositionId;
  /** 滑走の速度プロファイル */
  profile: SpeedSegment[];
  /** 滑走そのものに使う時間 */
  slideSpan: number;
  /** 1 ループの長さ */
  dur: number;
  description: string;
}

/* ============================================================
   速度プロファイル（確定）
   ============================================================ */

/** 等速 */
export const PROFILE_EVEN: SpeedSegment[] = [{ time: 1, distance: 1 }];

/**
 * 速度ムラ（ミス例）。等時間で消化する距離を変えることで速い/遅いを作る。
 * 平均速度は等速と同じなので、同じ滑走時間のまま「滑りが不均一」だけを比較できる。
 */
export const PROFILE_UNEVEN: SpeedSegment[] = [
  { time: 0.25, distance: 0.45 }, // 速すぎる
  { time: 0.25, distance: 0.1 },  // 止まりかける
  { time: 0.25, distance: 0.3 },  // また速い
  { time: 0.25, distance: 0.15 }, // 失速
];

/* ============================================================
   確定データ
   ============================================================ */

const SLIDE_SPAN = 0.34; // 標準の滑走時間・ループの 34%

function gliss(
  id: string,
  label: string,
  from: PositionId,
  to: PositionId,
  profile: SpeedSegment[],
  slideSpan: number,
  description: string,
): GlissandoDef {
  return { id, label, from, to, profile, slideSpan, dur: 7.0, description };
}

export const GLISSANDOS: Record<string, GlissandoDef> = {
  "6th-1st-even": gliss(
    "6th-1st-even", "グリッサンド 6th → 1st", "6th", "1st",
    PROFILE_EVEN, SLIDE_SPAN,
    "押さえたまま等速で下降する。グリッサンドは滑りが均一なのが原則。",
  ),
  "6th-1st-fast": gliss(
    "6th-1st-fast", "グリッサンド 6th → 1st", "6th", "1st",
    PROFILE_EVEN, SLIDE_SPAN / 2,
    "同じ距離を半分の時間で滑る。速度は倍。",
  ),
  "6th-1st-uneven": gliss(
    "6th-1st-uneven", "グリッサンド 6th → 1st", "6th", "1st",
    PROFILE_UNEVEN, SLIDE_SPAN,
    "滑走時間は等速と同じだが、速くなったり遅くなったりする。滑りが不均一なミス。",
  ),
};

export function getGlissando(id: string): GlissandoDef | undefined {
  return GLISSANDOS[id];
}

/* ============================================================
   タイムライン

   0            出発点で保持
   T0           滑走開始 ───┐
   T0+slideSpan 到着       ─┘  ← ここまで指は押さえたまま
   +0.16        到着点で保持
   +0.06        指を離す（開放弦）
   +0.22        出発点へ復帰（指は浮かせたまま = グリッサンドではない）
   +0.06        押弦
   1.0          ループ

   ⚠️ 復帰も押さえたまま滑らせると「上昇グリッサンド」に見えてしまう。
      必ず指を離して戻すこと。
   ============================================================ */

const T0 = 0.12;

export interface GlissKeyframe {
  /** 0-1 */
  t: number;
  /** シフト量 */
  d: number;
  /** 1=押弦 / 0=浮かせ */
  press: number;
  /** イージング */
  ease: "ease" | "linear";
}

export function glissKeyframes(g: GlissandoDef): GlissKeyframe[] {
  const dFrom = POSITIONS[g.from].d;
  const dTo = POSITIONS[g.to].d;
  const total = dTo - dFrom;

  const tEnd = T0 + g.slideSpan;
  const holdEnd = tEnd + 0.16;
  const relEnd = holdEnd + 0.06;
  const retEnd = relEnd + 0.22;
  const pressEnd = retEnd + 0.06;
  if (pressEnd >= 1) throw new Error(`${g.id}: タイムラインがループ長を超えている`);

  // --- 滑走区間（プロファイルどおり・等速なのでイージングなし） ---
  const kf: GlissKeyframe[] = [
    { t: 0, d: dFrom, press: 1, ease: "linear" },
    { t: T0, d: dFrom, press: 1, ease: "linear" },
  ];
  let tAcc = T0;
  let dAcc = 0;
  for (const seg of g.profile) {
    tAcc += g.slideSpan * seg.time;
    dAcc += seg.distance;
    kf.push({
      t: Math.round(tAcc * 1e4) / 1e4,
      d: Math.round((dFrom + total * dAcc) * 100) / 100,
      press: 1,
      ease: "linear", // ⚠️ 滑走にイージングを入れてはならない
    });
  }
  kf.push({ t: holdEnd, d: dTo, press: 1, ease: "linear" });
  kf.push({ t: relEnd, d: dTo, press: 0, ease: "ease" });
  kf.push({ t: retEnd, d: dFrom, press: 0, ease: "linear" });
  kf.push({ t: pressEnd, d: dFrom, press: 1, ease: "linear" });
  kf.push({ t: 1, d: dFrom, press: 1, ease: "linear" });
  return kf;
}

/** 区間ごとの速度。検証・表示用 */
export function glissSpeeds(g: GlissandoDef): number[] {
  const total = Math.abs(POSITIONS[g.to].d - POSITIONS[g.from].d);
  return g.profile.map((s) => (total * s.distance) / (g.dur * g.slideSpan * s.time));
}

/** 滑走中に逆走しないことを検証する */
export function assertMonotone(g: GlissandoDef): void {
  const kf = glissKeyframes(g);
  const dir = Math.sign(POSITIONS[g.to].d - POSITIONS[g.from].d);
  const slide = kf.filter((f) => f.t <= T0 + g.slideSpan + 1e-9);
  for (let i = 1; i < slide.length; i += 1) {
    if (dir * (slide[i].d - slide[i - 1].d) < -1e-6) {
      throw new Error(`${g.id}: 滑走中に逆走している`);
    }
  }
}

/* ============================================================
   CSS 生成
   ============================================================ */

const EASE = "cubic-bezier(0.42, 0, 0.58, 1)";
const LINEAR = "linear";

// CSS の translate は単位必須(unitless の translate(-34,-1.69) は無効化される)。
// fingerTransform/handTransform は SVG属性用に unitless を返すので、CSSキーフレーム用に px を付ける
// (2026-07-14 統合時の互換対応。ポジション移動と同じ)。
const withPx = (t: string) => t.replace(/(-?\d[\d.]*)/g, "$1px");

const block = (kf: GlissKeyframe[], decl: (f: GlissKeyframe) => string) =>
  kf
    .map(
      (f) =>
        `  ${Math.round(f.t * 10000) / 100}% { ${decl(f)} ` +
        `animation-timing-function: ${f.ease === "ease" ? EASE : LINEAR}; }`,
    )
    .join("\n");

/**
 * 1 つのグリッサンドに必要な CSS を生成する。
 *
 * ⚠️ 手形の持ち替えと胴オーバーレイは **d から導出**している（behindNeckAt / bodyOverlayAt）。
 *    速度を変えてもタイミングが自動で追従するのはこのため。時間で直書きしないこと。
 */
export function glissandoCSS(g: GlissandoDef, uid: string): string {
  const kf = glissKeyframes(g);
  const anim = `${g.dur}s linear infinite`;
  return `
@keyframes lh-gl-finger-${uid} {
${block(kf, (f) => `transform: ${withPx(fingerTransform(f.d))};`)}
}
@keyframes lh-gl-hand-${uid} {
${block(kf, (f) => `transform: ${withPx(handTransform(f.d))};`)}
}
@keyframes lh-gl-hand-front-op-${uid} {
${block(kf, (f) => `opacity: ${1 - behindNeckAt(f.d)};`)}
}
@keyframes lh-gl-hand-behind-op-${uid} {
${block(kf, (f) => `opacity: ${behindNeckAt(f.d)};`)}
}
@keyframes lh-gl-press-op-${uid} {
${block(kf, (f) => `opacity: ${f.press};`)}
}
@keyframes lh-gl-open-op-${uid} {
${block(kf, (f) => `opacity: ${1 - f.press};`)}
}
@keyframes lh-gl-overlay-op-${uid} {
${block(kf, (f) => `opacity: ${bodyOverlayAt(f.d)};`)}
}

.lh-${uid} .lh-gl-fingers     { animation: lh-gl-finger-${uid} ${anim}; }
.lh-${uid} .lh-gl-press       { animation: lh-gl-press-op-${uid} ${anim}; }
.lh-${uid} .lh-gl-open        { animation: lh-gl-open-op-${uid} ${anim}; }
.lh-${uid} .lh-gl-hand-front  { animation: lh-gl-hand-${uid} ${anim}, lh-gl-hand-front-op-${uid} ${anim}; }
.lh-${uid} .lh-gl-hand-behind { animation: lh-gl-hand-behind-op-${uid} ${anim}; }
.lh-${uid} .lh-gl-overlay     { animation: lh-gl-overlay-op-${uid} ${anim}; }

.lh-${uid}.is-paused * { animation-play-state: paused !important; }

@media (prefers-reduced-motion: reduce) {
  .lh-${uid} * { animation: none !important; }
}
`.trim();
}
