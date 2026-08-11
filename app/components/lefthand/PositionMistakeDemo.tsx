"use client";

/**
 * Arcoda 左手ポジション移動 — ミスパターンのデモ
 * （親指が1つ前のポジションに取り残される／指の軸が逆に傾く）
 *
 * PositionShiftDemo（正解）は CSS 駆動だが、こちらは **SMIL 駆動**。
 * 親指の遅れが path の `d` の変化として現れ、CSS の `d: path()` は対応環境が限られるため。
 *
 * 構造:
 *   <g.fingers>   ← transform: 移動 ＋ 剪断（s から導出）
 *   <g.hand-ok>   ← 正しい手。動き出しの直後にフェードアウト
 *   <g.hand-miss> ← 崩れた手。掌は transform、親指の遅れは d で表現
 *   <g.overlay>   ← 胴の前面再描画
 *
 * ⚠️ すべてのアニメーションが同一の keyTimes / keySplines を共有している。
 *    別々にすると親指が逆戻りする。
 */

import {
  COLORS,
  VIEWBOX,
  HAND_PATH,
  HAND_CREASES,
  MISS_HAND_CREASES,
  BODY_OVERLAY_FILL,
  BODY_OVERLAY_STROKE,
  missHandPathAt,
  PREV_POSITION,
  POSITIONS,
  type FingerPatternId,
} from "./lefthand-geometry";
import { FINGER_PATTERNS } from "./lefthand-fingers";
import { InstrumentShape } from "./LeftHand";
import {
  getMistake,
  smilTiming,
  missFingerTranslateValues,
  missShearTranslateValues,
  missSkewValues,
  missHandValues,
  missPathValues,
  okHandValues,
  opacityValues,
  type MistakeShift,
} from "./lefthand-mistake-motions";

export interface PositionMistakeDemoProps {
  /** "miss-1st-2nd" | "miss-1st-3rd" | "miss-1st-4th" */
  shift: string;
  /** 移動後に押さえる指のパターン・既定: 1の指のみ */
  pattern?: FingerPatternId;
  playing?: boolean;
  className?: string;
}

/** 共通の SMIL タイミング属性 */
function timingProps(m: MistakeShift, playing: boolean) {
  const t = smilTiming(m);
  return {
    calcMode: "spline" as const,
    keyTimes: t.keyTimes,
    keySplines: t.keySplines,
    dur: t.dur,
    repeatCount: "indefinite" as const,
    ...(playing ? {} : { begin: "indefinite" as const }),
  };
}

export function PositionMistakeDemo({
  shift: shiftId,
  pattern = "f1",
  playing = true,
  className,
}: PositionMistakeDemoProps) {
  const m = getMistake(shiftId);
  if (!m) return null;

  const p = FINGER_PATTERNS[pattern];
  const open = FINGER_PATTERNS.open;
  const tp = timingProps(m, playing);
  const needsOverlay = POSITIONS[m.target].bodyOverlay;

  const pressOp = opacityValues(m, (f) => f.press);
  const openOp = opacityValues(m, (f) => 1 - f.press);
  const missOp = opacityValues(m, (f) => f.miss);
  const okOp = opacityValues(m, (f) => 1 - f.miss);
  const ovOp = opacityValues(m, (f) => f.overlay);

  return (
    <svg
      viewBox={VIEWBOX}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${m.label}：${m.description}`}
    >
      <InstrumentShape />

      {/* 指: 移動＋剪断を s から導出。
          ⚠️ 剪断は matrix では補間できないため、additive="sum" の3本に分解している。
          順序を入れ替えてはならない。 */}
      <g>
        <animateTransform attributeName="transform" type="translate" {...tp}
          values={missFingerTranslateValues(m)} />
        <animateTransform attributeName="transform" type="translate" additive="sum" {...tp}
          values={missShearTranslateValues(m)} />
        <animateTransform attributeName="transform" type="skewX" additive="sum" {...tp}
          values={missSkewValues(m)} />
        {[open, p].map((fp, layer) => (
          <g key={layer}>
            <animate attributeName="opacity" {...tp} values={layer === 0 ? openOp : pressOp} />
            <path d={fp.mass} fill={COLORS.skin} stroke={COLORS.skinEdge}
              strokeWidth="2.4" strokeLinejoin="round" />
            <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round"
              opacity=".8" fill="none">
              {fp.creases.map((c, i) => <path key={i} d={c} />)}
            </g>
            <g fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
              {fp.nails.map((n, i) => <rect key={i} {...n} />)}
            </g>
          </g>
        ))}
      </g>

      {/* 正しい手: 動き出しの直後にフェードアウト */}
      <g>
        <animateTransform attributeName="transform" type="translate" {...tp}
          values={okHandValues(m)} />
        <animate attributeName="opacity" {...tp} values={okOp} />
        <path d={HAND_PATH} fill={COLORS.skin} stroke={COLORS.skinEdge}
          strokeWidth="2.4" strokeLinejoin="round" />
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round"
          opacity=".5" fill="none">
          {HAND_CREASES.map((c, i) => <path key={i} d={c} />)}
        </g>
      </g>

      {/* 崩れた手: 掌の遅れは transform、親指の遅れは d */}
      <g opacity={0}>
        <animateTransform attributeName="transform" type="translate" {...tp}
          values={missHandValues(m)} />
        <animate attributeName="opacity" {...tp} values={missOp} />
        <path d={missHandPathAt(m.target, 0)} fill={COLORS.skin} stroke={COLORS.skinEdge}
          strokeWidth="2.4" strokeLinejoin="round">
          <animate attributeName="d" {...tp} values={missPathValues(m)} />
        </path>
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round"
          opacity=".5" fill="none">
          {MISS_HAND_CREASES.map((c, i) => <path key={i} d={c} />)}
        </g>
      </g>

      {/* 胴オーバーレイ: 掌が胴に達する前に不透明化しきる */}
      {needsOverlay && (
        <g opacity={0}>
          <animate attributeName="opacity" {...tp} values={ovOp} />
          <path d={BODY_OVERLAY_FILL} fill={COLORS.wood} />
          <path d={BODY_OVERLAY_STROKE} fill="none" stroke={COLORS.woodEdge}
            strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}

      <title>{`${m.label}・親指は ${PREV_POSITION[m.target]} に取り残される`}</title>
    </svg>
  );
}
