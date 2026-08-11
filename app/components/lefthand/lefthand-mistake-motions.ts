/**
 * Arcoda 左手ポジション移動 — ミスパターンのモーション
 * （親指が1つ前のポジションに取り残される／指の軸が逆に傾く）
 *
 * 【設計の核 — s の一元管理】
 * ミス移動は「移動進捗 s（0→1）の時系列」という 1 つの数値で定義される。
 * s から、指・掌・親指の遅れ・剪断のすべてが導出される（lefthand-geometry.ts 参照）。
 *
 * 【なぜ SMIL なのか】
 * 親指の遅れは path の `d` 属性の変化として表現される（親指側 x 座標のみが線形に動く）。
 * CSS の `d: path()` は対応環境が限られるため、ミスモーションだけは SMIL で駆動する。
 * 正解モーション（lefthand-motions.ts）は CSS のままでよい。
 *
 * 【禁則 — 実際に踏んだ罠】
 * ❌ ミス手を到達位置で静止させ、終盤にクロスフェードしてはならない。
 *    正しい手が親指を前進させたあとにミス手の親指が後ろから現れ、**親指が逆戻りして見える。**
 * ❌ 親指の座標だけを s に比例させてはならない。ミス手は掌も 68px 引っ込んでいるため、
 *    s=0 のとき掌だけが左に残り、**親指の左に出っ張りが生じる。**
 * ❌ transform と d 属性で異なる keyTimes / keySplines を使ってはならない。
 *    進捗がずれ、**親指が逆戻りする。**
 */

import {
  POSITIONS,
  PREV_POSITION,
  missLag,
  missFingerTranslate,
  missShearTranslate,
  missSkew,
  missHandTranslate,
  okHandTranslate,
  missHandPathAt,
  type PositionId,
} from "./lefthand-geometry";

/* ============================================================
   型定義
   ============================================================ */

export interface MistakeKeyframe {
  /** 0-1 */
  t: number;
  /** 移動進捗 0-1 */
  s: number;
  /** 1の指が弦を押さえているか・0=浮かせ / 1=押弦 */
  press: number;
  /** 崩れた手形の不透明度・0=正しい手 / 1=ミス手 */
  miss: number;
  /** 胴オーバーレイの不透明度 */
  overlay: number;
  /** この点から次の点までのイージング */
  ease?: "ease" | "linear";
}

export interface MistakeShift {
  id: string;
  label: string;
  target: PositionId;
  dur: number;
  keyframes: MistakeKeyframe[];
  description: string;
}

/* ============================================================
   確定タイムライン

   0     開放弦
   .14   （静止）
   .19   1の指を押弦
   .32   出発 ─────────────┐
   .3425 手形の入れ替え完了  │ 崩れは移動と同時に始まる
   .47   到着 ─────────────┘
   .68   保持（耳で確認する間）→ 復路開始
   .8075 手形を戻しはじめる
   .83   帰着
   .90   指を離して開放弦へ（シームレスループ）

   ⚠️ 手形の入れ替えは「動き出しの直後」に済ませること。
      終盤に置くと親指が前進してから戻って見える。
   ============================================================ */

const EASE = "ease" as const;

function mistakeShift(target: PositionId, description: string): MistakeShift {
  const k = (
    t: number,
    s: number,
    press: number,
    miss: number,
    overlay: number,
    ease: "ease" | "linear" = "linear",
  ): MistakeKeyframe => ({ t, s, press, miss, overlay, ease });

  const ov = POSITIONS[target].bodyOverlay ? 1 : 0;
  return {
    id: `miss-1st-${target}`,
    label: `ミス 1st → ${target}`,
    target,
    dur: 6.0,
    description,
    keyframes: [
      k(0, 0, 0, 0, 0),
      k(0.14, 0, 0, 0, 0),
      k(0.19, 0, 1, 0, 0),
      k(0.32, 0, 1, 0, 0, EASE),
      k(0.3425, 0.15, 1, 1, ov, EASE),
      k(0.35, 0.2, 1, 1, ov, EASE),
      k(0.47, 1, 1, 1, ov),
      k(0.68, 1, 1, 1, ov, EASE),
      k(0.8, 0.8, 1, 1, ov, EASE),
      k(0.8075, 0.79, 1, 1, 0, EASE),
      k(0.83, 0, 1, 0, 0),
      k(0.9, 0, 0, 0, 0),
      k(1, 0, 0, 0, 0),
    ],
  };
}

export const MISTAKE_SHIFTS: Record<string, MistakeShift> = {
  "miss-1st-2nd": mistakeShift(
    "2nd",
    "親指が1stに取り残される。掌も動かないため、指だけが伸びて軸が逆に傾く。",
  ),
  "miss-1st-3rd": mistakeShift("3rd", "親指が2ndまでしか進まず、指が逆に傾く。"),
  "miss-1st-4th": mistakeShift("4th", "親指が3rdまでしか進まず、指が逆に傾く。"),
  // ⚠️ 5th / 6th のミスは作れない。
  //    正しい手が「親指がネック裏」形状のため、取り残される形が構造的に別物になる。
  //    元絵が提供されるまで、規則の外挿は禁止。
};

export function getMistake(id: string): MistakeShift | undefined {
  return MISTAKE_SHIFTS[id];
}

/** そのポジションでミスモーションが定義されているか */
export const hasMistake = (p: PositionId) => `miss-1st-${p}` in MISTAKE_SHIFTS;

/* ============================================================
   SMIL 値の生成

   ⚠️ transform / d / opacity は **すべて同一の keyTimes・keySplines** を共有する。
      別々にすると親指が逆戻りする。
   ============================================================ */

const SPLINE_EASE = ".42 0 .58 1";
const SPLINE_LINEAR = "0 0 1 1";

export interface SmilTiming {
  keyTimes: string;
  keySplines: string;
  dur: string;
}

export function smilTiming(m: MistakeShift): SmilTiming {
  return {
    keyTimes: m.keyframes.map((f) => f.t).join(";"),
    keySplines: m.keyframes
      .slice(0, -1)
      .map((f) => (f.ease === "ease" ? SPLINE_EASE : SPLINE_LINEAR))
      .join(";"),
    dur: `${m.dur}s`,
  };
}

const pair = (v: [number, number]) => `${v[0]} ${v[1]}`;

/**
 * 指の transform は **3本の animateTransform を additive="sum" で重ねる**。
 * 剪断 matrix(...) は animateTransform で補間できないため（type は
 * translate / scale / rotate / skewX / skewY のみ）。
 */
export const missFingerTranslateValues = (m: MistakeShift) =>
  m.keyframes.map((f) => pair(missFingerTranslate(m.target, f.s))).join(";");

export const missShearTranslateValues = (m: MistakeShift) =>
  m.keyframes.map((f) => pair(missShearTranslate(f.s))).join(";");

export const missSkewValues = (m: MistakeShift) =>
  m.keyframes.map((f) => missSkew(f.s)).join(";");

/** 崩れた手の平行移動 */
export const missHandValues = (m: MistakeShift) =>
  m.keyframes.map((f) => pair(missHandTranslate(m.target, f.s))).join(";");

/** 崩れた手の d */
export const missPathValues = (m: MistakeShift) =>
  m.keyframes.map((f) => missHandPathAt(m.target, f.s)).join(";");

/** 正しい手の平行移動 */
export const okHandValues = (m: MistakeShift) =>
  m.keyframes.map((f) => pair(okHandTranslate(m.target, f.s))).join(";");

export const opacityValues = (m: MistakeShift, pick: (f: MistakeKeyframe) => number) =>
  m.keyframes.map(pick).join(";");

/** 親指・掌の絶対x が単調増加し、最終値を超えないことを検証する */
export function assertMonotone(m: MistakeShift): void {
  const D = POSITIONS[m.target].d;
  const lag = missLag(m.target);
  const thumb = (s: number) => 314 + s * (D - lag);
  const palm = (s: number) => 471 + s * (D - 68);
  const fwd = m.keyframes.filter((f) => f.t <= 0.47).map((f) => f.s);
  for (let i = 1; i < fwd.length; i += 1) {
    if (thumb(fwd[i]) < thumb(fwd[i - 1]) - 1e-6 || palm(fwd[i]) < palm(fwd[i - 1]) - 1e-6) {
      throw new Error(`${m.id}: 親指または掌が逆戻りしている`);
    }
  }
  if (Math.max(...m.keyframes.map((f) => thumb(f.s))) > thumb(1) + 1e-6) {
    throw new Error(`${m.id}: 親指が最終位置を行き過ぎている`);
  }
}

/** 取り残される先 */
export const mistakeThumbStaysAt = (m: MistakeShift) => PREV_POSITION[m.target];
