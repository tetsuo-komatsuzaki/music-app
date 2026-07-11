"use client"

// AvatarBubble (C1) — v0.3 §2-3。
//  side  : アバター左 + 吹き出し右(左しっぽ)。質問画面共通
//  center: 中央吹き出し。tail="down"(キャラが下) / tail="up"(キャラが上)
// 中央は width:fit-content 固定 — flex:1 の縦伸び事故対策(指示書§2の罠)。

import type { ReactNode } from "react"
import styles from "../onboarding.module.css"
import { ArcoChan, type ArcoPoseKey } from "./ArcoChan"

export default function AvatarBubble({
  children,
  poseKey = "question",
  variant = "side",
  tail = "down",
}: {
  children: ReactNode
  poseKey?: ArcoPoseKey
  variant?: "side" | "center"
  tail?: "down" | "up"
}) {
  if (variant === "center") {
    return (
      <div
        className={[
          styles.bubble,
          styles.bubbleCenter,
          tail === "up" ? styles.bubbleUp : "",
        ].join(" ")}
      >
        {children}
      </div>
    )
  }
  return (
    <div className={styles.qa}>
      <div className={`${styles.avatar} ${styles.arcoEnter}`}>
        <ArcoChan poseKey={poseKey} />
      </div>
      <div className={styles.bubble}>{children}</div>
    </div>
  )
}
