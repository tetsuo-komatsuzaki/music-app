"use client"

// 学びレッスン用 ビブラートモーション (VibratoDemo をレッスンカード向けにクロップ再合成)。
// 親指を支点に、掌だけが d の変化として揺れる (SMIL駆動)。指の transform と掌の d は同一keyTimes。
//   vibrato="3rd-stiff-hand"(手が固まって指だけ滑る) = 間違い側 / "3rd-ok"(手と指が一緒に揺れる) = コツ側。
// アセットは app/components/lefthand (公式資産)。掌の d アニメはCSS不可のため SMIL (px化対象外)。

import { useId } from "react"
import {
  COLORS,
  POSITIONS,
  HAND_CREASES,
  handTransform,
  handPathPivotThumb,
  handCreasesPivotThumb,
  type FingerPatternId,
} from "@/app/components/lefthand/lefthand-geometry"
import { FINGER_PATTERNS } from "@/app/components/lefthand/lefthand-fingers"
import { InstrumentShape, BodyOverlay } from "@/app/components/lefthand/LeftHand"
import {
  getVibrato,
  smilTiming,
  fingerValues,
  handPathValues,
  handCreaseValues,
  vibratoNoteD,
} from "@/app/components/lefthand/lefthand-vibrato-motions"

// ビブラートは3rdポジション・1の指固定。手+押弦指が入る画角にクロップ
const CROP = "390 230 570 490"

export default function LessonVibrato({
  vibrato: vibratoId,
  pattern = "f1",
}: {
  vibrato: string
  pattern?: FingerPatternId
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const v = getVibrato(vibratoId)
  if (!v) return null

  const pos = POSITIONS[v.position]
  const noteD = vibratoNoteD(v)
  const fp = FINGER_PATTERNS[pattern]
  const t = smilTiming(v)
  const tp = {
    calcMode: "spline" as const,
    keyTimes: t.keyTimes,
    keySplines: t.keySplines,
    dur: t.dur,
    repeatCount: "indefinite" as const,
  }
  // handRatio = 0（ミス）では掌も動かない → アニメーションを出力しない
  const palmMoves = v.handRatio > 0

  return (
    <svg
      viewBox={CROP}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${v.label}：${v.description}`}
    >
      <InstrumentShape />

      {/* 指 */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          {...tp}
          values={fingerValues(v)}
        />
        <path
          d={fp.mass}
          fill={COLORS.skin}
          stroke={COLORS.skinEdge}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".8" fill="none">
          {fp.creases.map((c, i) => (
            <path key={i} d={c} />
          ))}
        </g>
        <g fill={COLORS.nail} stroke={COLORS.skinEdge} strokeWidth="1.4">
          {fp.nails.map((n, i) => (
            <rect key={i} {...n} />
          ))}
        </g>
      </g>

      {/* 手: 群 transform は基準音の位置で固定。掌だけを d で動かす（親指は支点＝不動） */}
      <g transform={handTransform(noteD)}>
        <path
          d={handPathPivotThumb(0)}
          fill={COLORS.skin}
          stroke={COLORS.skinEdge}
          strokeWidth="2.4"
          strokeLinejoin="round"
        >
          {palmMoves && <animate attributeName="d" {...tp} values={handPathValues(v)} />}
        </path>
        <g stroke={COLORS.skinEdge} strokeWidth="2" strokeLinecap="round" opacity=".5" fill="none">
          {HAND_CREASES.map((_, i) => (
            <path key={i} d={handCreasesPivotThumb(0)[i]}>
              {palmMoves && <animate attributeName="d" {...tp} values={handCreaseValues(v, i)} />}
            </path>
          ))}
        </g>
      </g>

      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  )
}
