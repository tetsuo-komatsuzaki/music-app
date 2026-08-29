"use client"

// モーション付きアルコ (2026-08-23 写経: /proto v3 §1.6 alco-motion)。
// ループmp4を自動再生し、モーション低減設定の人にはポスター静止画だけを見せる。
// 素材は /public/proto/assets/motion/ の配信用ASCII名 (原本kit: shiftB/arco-motion-kit)。
//
// 2026-08-29: iOSの低電力モード等で自動再生が拒否されると、OSが動画の上に
// 再生ボタンを描いてしまう (Tetsuo実機指摘)。play() の失敗を検知したら
// 動画をやめてポスター静止画に切り替える。
import { useEffect, useRef, useState } from "react"
import styles from "./ArcoMotion.module.css"

export type ArcoKit = "01C" | "05A" | "05C" | "06A" | "09B"

export default function ArcoMotion({ kit, label, className }: {
  kit: ArcoKit
  label: string
  /** 追加クラス (寸法・角丸は置き場所側で決める) */
  className?: string
}) {
  const poster = `/proto/assets/motion/${kit}_poster.jpg`
  const mp4 = `/proto/assets/motion/${kit}_motion_loop.mp4`
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stillOnly, setStillOnly] = useState(false)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const p = v.play()
    if (p && typeof p.catch === "function") {
      p.catch(() => setStillOnly(true))
    }
  }, [])

  return (
    <span className={`${styles.wrap} ${className ?? ""}`}>
      {!stillOnly && (
        <video ref={videoRef} className={styles.video} autoPlay muted loop playsInline poster={poster} aria-label={label}>
          <source src={mp4} type="video/mp4" />
        </video>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- 動画のポスターと同一素材のためImage最適化不要 */}
      <img className={styles.still} src={poster} alt={label} style={stillOnly ? { display: "block" } : undefined} />
    </span>
  )
}
