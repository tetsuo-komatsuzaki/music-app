"use client"

// 弓系レッスンのスライド3(よくある間違い)・4(コツ)用の静止図。
// スライド2/5の運弓モーション(LessonBowingMotion)と同じバイオリン+弓の2ビューを
// アニメーションなしで描き、視覚を統一する (2026-07-12 Tetsuo指示: 弓系だけ新描画に統一)。
//   mark="cross" … 間違い: 接弦点に赤い✕
//   mark="hint"  … コツ  : 接弦点にティール色の運弓方向の矢印
// 描画は公式資産 (BowShape/ViolinBody/violin-geometry) のみ使用。

import { BowShape } from "@/app/components/violin/Bow"
import { ViolinBody } from "@/app/components/violin/Violin"
import {
  COLORS,
  VIOLIN_ROTATE,
  HAIR_Y,
  stringDisplayY,
} from "@/app/components/violin/violin-geometry"
import styles from "../lessons.module.css"

// LessonBowingMotion と同一の幾何定数
const C_SIDE = 250
const SC = 1.35
const BOW_X = 360
const TGT = 2 // A線
const HAIR_Y_CONST = HAIR_Y

const ERR = "#E5484D"

function CrossMark({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <path
      d={`M ${x - s},${y - s} L ${x + s},${y + s} M ${x + s},${y - s} L ${x - s},${y + s}`}
      stroke={ERR}
      strokeWidth={s * 0.34}
      strokeLinecap="round"
      fill="none"
    />
  )
}

function DownArrow({ x, y, s }: { x: number; y: number; s: number }) {
  // 接弦点の上に運弓方向(ダウン)の矢印
  return (
    <path
      d={`M ${x},${y - s * 2.2} L ${x},${y - s * 0.2} M ${x - s * 0.7},${y - s} L ${x},${y - s * 0.2} L ${x + s * 0.7},${y - s}`}
      stroke={COLORS.teal}
      strokeWidth={s * 0.32}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  )
}

export default function LessonBowingStatic({ mark }: { mark?: "cross" | "hint" | null }) {
  const CV = stringDisplayY(TGT, BOW_X)
  const TX = BOW_X - SC * HAIR_Y_CONST
  const Mark = mark === "cross" ? CrossMark : mark === "hint" ? DownArrow : null

  return (
    <div className={styles.motionRow}>
      <div className={styles.mCol}>
        <div className={styles.mCap}>うえから</div>
        <div className={styles.mFig}>
          <svg viewBox="-10 -120 514 530" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="上から">
            <g transform={VIOLIN_ROTATE}>
              <ViolinBody />
            </g>
            <line x1="262" y1={CV} x2="405" y2={CV} stroke={COLORS.teal} strokeWidth="3" opacity=".35" />
            <g transform={`translate(${TX},${CV}) rotate(-90) scale(${SC})`}>
              <BowShape />
            </g>
            {Mark && <Mark x={BOW_X} y={CV} s={34} />}
          </svg>
        </div>
      </div>
      <div className={styles.mCol}>
        <div className={styles.mCap}>よこから</div>
        <div className={styles.mFig}>
          <svg viewBox="-60 0 660 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="横から">
            <line x1="-60" y1={HAIR_Y_CONST} x2="600" y2={HAIR_Y_CONST} stroke={COLORS.string} strokeWidth="2.4" />
            <g transform={`translate(${C_SIDE},0)`}>
              <BowShape />
            </g>
            {Mark && <Mark x={C_SIDE} y={HAIR_Y_CONST} s={26} />}
          </svg>
        </div>
      </div>
    </div>
  )
}
