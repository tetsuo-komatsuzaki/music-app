"use client"

// 学びレッスン用 左手ポジション移動モーション (弓系の LessonBowingMotion に相当)。
// pos2 の「フレームごと運ぶ」(S2) で 1st→2nd の手の移動アニメを見せる。
// アセットは app/components/lefthand (公式資産・弓アセットと同設計・d の一元管理)。
// レッスンカードは小さいので、手+ネック周辺だけにクロップして見やすくする (Tetsuo指示)。
// PositionShiftDemo と同じ構成だが viewBox をクロップし figCard 全面に配置する。

import { useId } from "react"
import { getShift, shiftCSS } from "@/app/components/lefthand/lefthand-motions"
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "@/app/components/lefthand/LeftHand"
import { POSITIONS } from "@/app/components/lefthand/lefthand-geometry"

// 手+ネック周辺のみ (アセットは 0 0 1000 1000。左のスクロール/ペグは画角外)
const CROP = "300 230 560 430"

export default function LessonPositionShift({ shift: shiftId }: { shift: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const shift = getShift(shiftId)
  if (!shift) return null
  const target = POSITIONS[shift.target]
  const css = shiftCSS(shift, uid)

  return (
    <svg
      viewBox={CROP}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      style={{ width: "100%", height: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${shift.label}：${shift.description}`}
    >
      <style>{css}</style>
      <InstrumentShape />
      {/* 指: d の時系列で移動 (フレームは1の指のみ) */}
      <FingersShape d={0} pattern="f1" className="lh-fingers" />
      {/* 手(通常形状): 移動する。持ち替えを伴う場合は到達時にフェードアウト */}
      <HandShape d={0} className={shift.hasThumbSwitch ? "lh-hand-front" : "lh-hand"} />
      {/* 手(ネック裏形状): 5th/6th のみ (1st-2nd では不使用) */}
      {shift.hasThumbSwitch && (
        <g className="lh-hand-behind" opacity="0">
          <HandShape d={target.d} behindNeck />
        </g>
      )}
      {/* 胴オーバーレイ: 3rd 以上のみ (1st-2nd では不使用) */}
      {target.bodyOverlay && <BodyOverlay className="lh-overlay" />}
    </svg>
  )
}
