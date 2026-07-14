"use client"

// 学びレッスン用 指板俯瞰図 (fingerboard パッケージの FingerboardDemo をカードに収める薄いラッパ)。
// 非重音レッスン=横長(1000×470)をS1「これは何」に譜面と併記 / 重音レッスン=縦型(470×1000)をS4「コツ」に。
// アセットは app/components/fingerboard (左手/弓とは独立した新規パッケージ)。SMIL駆動 (px化対象外)。

import { FingerboardDemo, FingerboardMissDemo } from "@/app/components/fingerboard"
import styles from "../lessons.module.css"

export default function LessonFingerboard({
  lesson,
  miss,
}: {
  lesson: string
  /** 重音S3のミス図: "pull"=引っ張られて音程が潰れる / "late"=同時に置けない */
  miss?: "pull" | "late"
}) {
  return miss ? (
    <FingerboardMissDemo lesson={lesson} type={miss} className={styles.fbFill} />
  ) : (
    <FingerboardDemo lesson={lesson} className={styles.fbFill} />
  )
}
