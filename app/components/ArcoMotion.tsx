// モーション付きアルコ (2026-08-23 写経: /proto v3 §1.6 alco-motion)。
// ループmp4を自動再生し、モーション低減設定の人にはポスター静止画だけを見せる。
// 素材は /public/proto/assets/motion/ の配信用ASCII名 (原本kit: shiftB/arco-motion-kit)。
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
  return (
    <span className={`${styles.wrap} ${className ?? ""}`}>
      <video className={styles.video} autoPlay muted loop playsInline poster={poster} aria-label={label}>
        <source src={mp4} type="video/mp4" />
      </video>
      {/* eslint-disable-next-line @next/next/no-img-element -- 動画のポスターと同一素材のためImage最適化不要 */}
      <img className={styles.still} src={poster} alt={label} />
    </span>
  )
}
