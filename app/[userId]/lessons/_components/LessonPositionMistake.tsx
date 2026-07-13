"use client"

// 学びレッスン用 左手ポジション移動「よくある間違い」モーション。
// 親指が1つ前のポジションに取り残される/指の軸が逆傾き。PositionMistakeDemo(SMIL駆動)を
// レッスンカード向けに手+ネック周辺へクロップして再構成 (Tetsuo指示: S3を差し替え)。
//   miss-1st-2nd / miss-1st-3rd / miss-1st-4th のみ (5th/6thのミスは構造上存在しない)。
// アセットは app/components/lefthand (公式資産)。SMILは unitless で有効なので px化は不要。

import {
  COLORS,
  HAND_PATH,
  HAND_CREASES,
  MISS_HAND_CREASES,
  BODY_OVERLAY_FILL,
  BODY_OVERLAY_STROKE,
  missHandPathAt,
  POSITIONS,
} from "@/app/components/lefthand/lefthand-geometry"
import { FINGER_PATTERNS } from "@/app/components/lefthand/lefthand-fingers"
import { InstrumentShape } from "@/app/components/lefthand/LeftHand"
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
} from "@/app/components/lefthand/lefthand-mistake-motions"

export default function LessonPositionMistake({ shift: shiftId }: { shift: string }) {
  const m = getMistake(shiftId)
  if (!m) return null

  const press = FINGER_PATTERNS.f1
  const open = FINGER_PATTERNS.open
  const t = smilTiming(m)
  const tp = {
    calcMode: "spline" as const,
    keyTimes: t.keyTimes,
    keySplines: t.keySplines,
    dur: t.dur,
    repeatCount: "indefinite" as const,
  }
  const needsOverlay = POSITIONS[m.target].bodyOverlay

  // 手+ネック周辺にクロップ。胴オーバーレイのある 3rd/4th は右へ拡張 (LessonPositionShift と同じ)
  const rightEdge = needsOverlay ? 1015 : 865
  const crop = `300 210 ${rightEdge - 300} 470`

  const pressOp = opacityValues(m, (f) => f.press)
  const openOp = opacityValues(m, (f) => 1 - f.press)
  const missOp = opacityValues(m, (f) => f.miss)
  const okOp = opacityValues(m, (f) => 1 - f.miss)
  const ovOp = opacityValues(m, (f) => f.overlay)

  return (
    <svg
      viewBox={crop}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${m.label}：${m.description}`}
    >
      <InstrumentShape />

      {/* 指: 移動＋剪断を s から導出 (剪断は matrix補間不可のため additive で3本重ね) */}
      <g>
        <animateTransform attributeName="transform" type="translate" {...tp} values={missFingerTranslateValues(m)} />
        <animateTransform attributeName="transform" type="translate" additive="sum" {...tp} values={missShearTranslateValues(m)} />
        <animateTransform attributeName="transform" type="skewX" additive="sum" {...tp} values={missSkewValues(m)} />
        {[open, press].map((fp, layer) => (
          <g key={layer}>
            <animate attributeName="opacity" {...tp} values={layer === 0 ? openOp : pressOp} />
            <path d={fp.mass} fill={COLORS.skin} stroke={COLORS.skinEdge} strokeWidth="2.4" strokeLinejoin="round" />
            <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
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
        <animateTransform attributeName="transform" type="translate" {...tp} values={okHandValues(m)} />
        <animate attributeName="opacity" {...tp} values={okOp} />
        <path d={HAND_PATH} fill={COLORS.skin} stroke={COLORS.skinEdge} strokeWidth="2.4" strokeLinejoin="round" />
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
          {HAND_CREASES.map((c, i) => <path key={i} d={c} />)}
        </g>
      </g>

      {/* 崩れた手: 掌の遅れは transform、親指の遅れは d */}
      <g opacity={0}>
        <animateTransform attributeName="transform" type="translate" {...tp} values={missHandValues(m)} />
        <animate attributeName="opacity" {...tp} values={missOp} />
        <path d={missHandPathAt(m.target, 0)} fill={COLORS.skin} stroke={COLORS.skinEdge} strokeWidth="2.4" strokeLinejoin="round">
          <animate attributeName="d" {...tp} values={missPathValues(m)} />
        </path>
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
          {MISS_HAND_CREASES.map((c, i) => <path key={i} d={c} />)}
        </g>
      </g>

      {/* 胴オーバーレイ: 掌が胴に達する前に不透明化しきる */}
      {needsOverlay && (
        <g opacity={0}>
          <animate attributeName="opacity" {...tp} values={ovOp} />
          <path d={BODY_OVERLAY_FILL} fill={COLORS.wood} />
          <path d={BODY_OVERLAY_STROKE} fill="none" stroke={COLORS.woodEdge} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
