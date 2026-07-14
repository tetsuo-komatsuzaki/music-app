"use client"

// 学びレッスン用 トリルモーション (TrillDemo をレッスンカード向けに手周辺へクロップ)。
// 主音を押さえたまま上の指を上げ下げ (手は動かない・d固定)。step-endで指パターンを交替。
//   liftStyle="raised"(立ち) = 間違い側 / "hover"(浮き) = コツ側 (Tetsuo指示)。
// アセットは app/components/lefthand (公式資産)。transform非アニメなので px化は不要。

import { useId } from "react"
import { POSITIONS } from "@/app/components/lefthand/lefthand-geometry"
import {
  getTrill,
  trillCSS,
  trillD,
  type TrillLiftStyle,
} from "@/app/components/lefthand/lefthand-trill-motions"
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "@/app/components/lefthand/LeftHand"

// トリルは1stポジション固定。手+指(立て指は上へ伸びる)が入る画角にクロップ
const CROP = "295 170 500 500"

export default function LessonTrill({
  trill: trillId,
  liftStyle,
}: {
  trill: string
  liftStyle: TrillLiftStyle
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const t = getTrill(trillId)
  if (!t) return null
  const d = trillD(t)
  const pos = POSITIONS[t.position]

  return (
    <svg
      viewBox={CROP}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${t.label}：${t.description}`}
    >
      <style>{trillCSS(t, uid)}</style>
      <InstrumentShape />
      {/* 主音(指が弦に触れている) */}
      <FingersShape d={d} pattern={t.lower} className="lh-trill-lower" />
      {/* 補助音(指を上げた) */}
      <FingersShape d={d} pattern={t.upper[liftStyle]} className="lh-trill-upper" opacity={0} />
      <HandShape d={d} behindNeck={pos.thumbBehindNeck} />
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  )
}
