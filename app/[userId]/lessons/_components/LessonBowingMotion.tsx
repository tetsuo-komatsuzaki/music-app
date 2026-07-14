"use client"

// 運弓モーション2ビュー (弓系レッスンのスライド2・5用)
// プロトタイプv3.18 bowingDemo() の忠実移植。図解モーション要件v1.0 A-3/A-6 +
// 図解アセット仕様書v1.2 §10 準拠:
//   - 左=うえから(バイオリン正面+弓・viewBox -10 -120 514 530)
//   - 右=よこから(側面模式図・viewBox -60 0 660 130)
//   - キャプションはイラスト上部・両カラム上端揃え・イラストは残り領域の垂直中央
//   - レッスン画面では「弦」「A線」ラベルは省略 (§10-3)
//   - 正面図では lift を使わない(離弦は奥行き方向のため描けない=仕様)
// 描画は公式資産 (BowShape/ViolinBody/violin-geometry/bowing-motions) のみ使用。

import { useId } from "react"
import { BowShape } from "@/app/components/violin/Bow"
import { ViolinBody } from "@/app/components/violin/Violin"
import {
  COLORS,
  VIOLIN_ROTATE,
  HAIR_Y,
  stringDisplayY,
} from "@/app/components/violin/violin-geometry"
import {
  getTechnique,
  sideKeyframes,
  violinKeyframes,
  contactKeyframes,
} from "@/app/components/violin/bowing-motions"
import { getBowingMistake } from "@/app/components/violin/bowing-mistake-motions"
import styles from "../lessons.module.css"

// 幾何定数 (図解モーション要件v1.0 A-3 確定値)
const C_SIDE = 250
const SC = 1.35
const BOW_X = 360
const TGT = 2 // A線

export default function LessonBowingMotion({
  motionId,
  view = "both",
}: {
  motionId: string
  /** "both"=うえから+よこから (S2/S5) / "side"=よこから単独 (弓系S3/S4の運弓比較用) */
  view?: "both" | "side"
}) {
  // ミスモーション(別配列)を優先解決。getTechnique は未知idで detache に倒れるため先に引く
  const tech = getBowingMistake(motionId) ?? getTechnique(motionId)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
  const dir = tech.alternate ? "alternate" : "normal"
  const CV = stringDisplayY(TGT, BOW_X)
  const TX = BOW_X - SC * HAIR_Y

  const css = `
    @keyframes mS-${uid}{${sideKeyframes(tech)}}
    @keyframes mV-${uid}{${violinKeyframes(tech)}}
    ${tech.hasBounce ? `@keyframes mD-${uid}{${contactKeyframes(tech)}}` : ""}
    .mS-${uid}{animation:mS-${uid} ${tech.duration}s ease-in-out infinite ${dir};}
    .mV-${uid}{animation:mV-${uid} ${tech.duration}s ease-in-out infinite ${dir};}
    ${tech.hasBounce ? `.mD-${uid}{animation:mD-${uid} ${tech.duration}s ease-in-out infinite ${dir};}` : ""}
    @media (prefers-reduced-motion: reduce){
      .mS-${uid},.mV-${uid},.mD-${uid}{animation:none !important;}
    }
  `

  const sideView = (
    <div className={styles.mCol}>
      <div className={styles.mCap}>よこから</div>
      <div className={styles.mFig}>
        <svg viewBox="-60 0 660 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="横から">
          <line x1="-60" y1={HAIR_Y} x2="600" y2={HAIR_Y} stroke={COLORS.string} strokeWidth="2.4" />
          <circle className={tech.hasBounce ? `mD-${uid}` : undefined} cx={C_SIDE} cy={HAIR_Y} r="5.5" fill={COLORS.teal} opacity=".85" />
          <g transform={`translate(${C_SIDE},0)`}>
            <g className={`mS-${uid}`}>
              <BowShape />
            </g>
          </g>
        </svg>
      </div>
    </div>
  )

  return (
    <div className={styles.motionRow}>
      <style>{css}</style>
      {view === "both" && (
        <div className={styles.mCol}>
          <div className={styles.mCap}>うえから</div>
          <div className={styles.mFig}>
            <svg viewBox="-10 -120 514 530" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="上から">
              <g transform={VIOLIN_ROTATE}>
                <ViolinBody />
              </g>
              <line x1="262" y1={CV} x2="405" y2={CV} stroke={COLORS.teal} strokeWidth="3" opacity=".35" />
              <g transform={`translate(${TX},${CV}) rotate(-90) scale(${SC})`}>
                <g className={`mV-${uid}`}>
                  <BowShape />
                </g>
              </g>
              <circle className={tech.hasBounce ? `mD-${uid}` : undefined} cx={BOW_X} cy={CV} r="5.5" fill={COLORS.teal} opacity=".9" />
            </svg>
          </div>
        </div>
      )}
      {sideView}
    </div>
  )
}
