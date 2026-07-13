"use client"

// 学びレッスン用 左手ポジション移動モーション (弓系の LessonBowingMotion に相当)。
// pos2〜pos6 の S2(体の使い方)で 1st→目標ポジションへの手の移動アニメを見せる。
// アセットは app/components/lefthand (公式資産・弓アセットと同設計・d の一元管理)。
// PositionShiftDemo と同じ合成だが、レッスンカードは小さいので手+ネック周辺にクロップし、
// figCard 全面に配置する (Tetsuo指示)。
//   - 指: 外側の <g class=lh-fingers> が CSS で移動。内側は animated で transform を出さない
//     (二重変換防止)。開放弦(open)→押弦(press) を opacity でクロスフェード。
//   - 手: ナット側(lh-hand/lh-hand-front)が移動。5th/6th は終盤にネック裏形状へフェード。
//   - 胴オーバーレイ: 3rd 以上で手が胴に達する前に不透明化。

import { useId } from "react"
import { getShift, shiftCSS } from "@/app/components/lefthand/lefthand-motions"
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "@/app/components/lefthand/LeftHand"
import { POSITIONS } from "@/app/components/lefthand/lefthand-geometry"

export default function LessonPositionShift({ shift: shiftId }: { shift: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const shift = getShift(shiftId)
  if (!shift) return null

  const target = POSITIONS[shift.target]
  const css = shiftCSS(shift, uid)
  const needsOverlay = target.bodyOverlay

  // 手+ネック周辺にクロップ (左のスクロール/ペグは画角外)。高ポジションほど手が右へ
  // 進む & 胴に達するため、胴オーバーレイのある 3rd 以上は右端まで広げる。
  const rightEdge = needsOverlay ? 1015 : 865
  const crop = `300 210 ${rightEdge - 300} 470`

  return (
    <svg
      viewBox={crop}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${shift.label}：${shift.description}`}
    >
      <style>{css}</style>

      <InstrumentShape />

      {/* 指: 外側の <g> が d に沿って動く。内側は animated で transform を出さない */}
      <g className="lh-fingers">
        <FingersShape d={0} pattern="open" animated className="lh-fingers-open" />
        <FingersShape d={0} pattern="f1" animated className="lh-fingers-press" opacity={0} />
      </g>

      {/* 手(ナット側形状): 移動する。持ち替えを伴う場合は終盤にフェードアウト */}
      <HandShape d={0} animated className={shift.hasThumbSwitch ? "lh-hand-front" : "lh-hand"} />

      {/* 手(ネック裏形状): 持ち替え(5th/6th)のみ。静止しており、指だけが先へ伸びる */}
      {shift.hasThumbSwitch && (
        <g className="lh-hand-behind" opacity={0}>
          <HandShape d={shift.behindHandD} behindNeck />
        </g>
      )}

      {/* 胴オーバーレイ: 3rd 以上。手が胴に達する前に不透明化(掌の透け防止) */}
      {needsOverlay && <BodyOverlay className="lh-overlay" />}
    </svg>
  )
}
