"use client"

// 学びレッスン用 装飾音モーション (OrnamentDemo をレッスンカード向けにクロップ再合成)。
// 「プラルトリラーとモルデント」は1レッスンで2技術を扱うため、1スライドに両方を横並び表示する。
//   kind="slow"(指を立てて装飾がもたつく) = 間違い側 / "ok"(拍頭で瞬時に装飾) = 正解側。
// 手は動かず、主音レイヤ⇔装飾レイヤの opacity を step-end で切替 (CSS)。px化対象外。
// アセットは app/components/lefthand (公式資産)。

import { useId } from "react"
import { POSITIONS } from "@/app/components/lefthand/lefthand-geometry"
import {
  getOrnament,
  ornamentCSS,
  ornamentD,
} from "@/app/components/lefthand/lefthand-ornament-motions"
import {
  InstrumentShape,
  FingersShape,
  HandShape,
  BodyOverlay,
} from "@/app/components/lefthand/LeftHand"
import styles from "../lessons.module.css"

// 装飾音は1stポジション固定。手+指(ミスは立て指が上へ伸びる)が入る画角にクロップ (トリルと同じ)
const CROP = "295 170 500 500"

function OrnamentFig({ ornamentId }: { ornamentId: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const o = getOrnament(ornamentId)
  if (!o) return null
  const d = ornamentD(o)
  const pos = POSITIONS[o.position]

  return (
    <svg
      viewBox={CROP}
      preserveAspectRatio="xMidYMid meet"
      className={`lh-${uid}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${o.label}：${o.description}`}
    >
      <style>{ornamentCSS(o, uid)}</style>
      <InstrumentShape />
      {/* 主音(ド) */}
      <FingersShape d={d} pattern={o.main} className="lh-orn-main" />
      {/* 装飾音(プラル=レ / モルデント=シ) */}
      <FingersShape d={d} pattern={o.ornament} className="lh-orn-aux" opacity={0} />
      <HandShape d={d} behindNeck={pos.thumbBehindNeck} />
      {pos.bodyOverlay && <BodyOverlay />}
    </svg>
  )
}

export default function LessonOrnament({ kind }: { kind: "ok" | "slow" }) {
  return (
    <div className={styles.motionRow}>
      <div className={styles.mCol}>
        <div className={styles.mCap}>プラルトリラー</div>
        <div className={styles.mFig}>
          <OrnamentFig ornamentId={`pralltriller-${kind}`} />
        </div>
      </div>
      <div className={styles.mCol}>
        <div className={styles.mCap}>モルデント</div>
        <div className={styles.mFig}>
          <OrnamentFig ornamentId={`mordent-${kind}`} />
        </div>
      </div>
    </div>
  )
}
