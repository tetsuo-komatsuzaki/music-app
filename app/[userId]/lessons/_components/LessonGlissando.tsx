"use client"

// 学びレッスン用 グリッサンドモーション (GlissandoDemo をレッスンカード向けにクロップ)。
// 指を押さえたまま d を連続変化させて滑走。手形の持ち替え・胴オーバーレイは d から導出。
//   glissando="6th-1st-uneven"(速度ムラ) = 間違い側 / "6th-1st-fast"(倍速) = コツ側 (Tetsuo指示)。
// アセットは app/components/lefthand (公式資産)。CSSの transform は px化済み(glissando-motions)。

import { useId } from "react"
import { POSITIONS, HAND_SWITCH_D_HI } from "@/app/components/lefthand/lefthand-geometry"
import {
  getGlissando,
  glissandoCSS,
  glissKeyframes,
} from "@/app/components/lefthand/lefthand-glissando-motions"
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "@/app/components/lefthand/LeftHand"

// 6th→1st は首全体を滑るため、手+ネックを右まで含む広めのクロップ (ポジション移動の胴あり crop と同じ)
const CROP = "300 210 715 470"

export default function LessonGlissando({ glissando: glissId }: { glissando: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const g = getGlissando(glissId)
  if (!g) return null

  const kf = glissKeyframes(g)
  const dMax = Math.max(...kf.map((f) => f.d))
  const dMin = Math.min(...kf.map((f) => f.d))
  const needsBehind = dMax >= HAND_SWITCH_D_HI
  const needsOverlay =
    POSITIONS[g.from].bodyOverlay || POSITIONS[g.to].bodyOverlay || dMax > dMin

  return (
    <svg
      viewBox={CROP}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${g.label}：${g.description}`}
    >
      <style>{glissandoCSS(g, uid)}</style>
      <InstrumentShape />
      {/* 指: 外側の <g> が d に沿って動く。内側は animated で transform を出さない */}
      <g className="lh-gl-fingers">
        <FingersShape d={0} pattern="f1" animated className="lh-gl-press" />
        <FingersShape d={0} pattern="open" animated className="lh-gl-open" opacity={0} />
      </g>
      <HandShape d={0} animated className="lh-gl-hand-front" />
      {needsBehind && (
        <g className="lh-gl-hand-behind" opacity={0}>
          <HandShape d={dMax} behindNeck />
        </g>
      )}
      {needsOverlay && <BodyOverlay className="lh-gl-overlay" />}
    </svg>
  )
}
