"use client"

// 学びレッスン用 ハーモニクス モーション (HarmonicMotionDemo をレッスンカード向けにクロップ)。
// 1/2点(4thポジション・4の指): 開放→1st→4thへ移動→軽く乗せる→聴く→離す→戻る の周回。
//   正=軽く触れる(half-ok) / 誤=押さえすぎ(half-press・図自身に✗と注釈)。
// 手が1st→4thへ移動するため広めの画角。アセットは app/components/lefthand (公式資産・CSS駆動px化済)。

import { HarmonicMotionDemo } from "@/app/components/lefthand/HarmonicMotionDemo"
import styles from "../lessons.module.css"

// 1st→4thの移動範囲＋接触リング＋注釈が入る画角
const CROP = "200 150 800 540"

export default function LessonHarmonics({ mistake }: { mistake?: boolean }) {
  return (
    <HarmonicMotionDemo
      motion={mistake ? "half-press" : "half-ok"}
      crop={CROP}
      className={styles.fbFill}
    />
  )
}
