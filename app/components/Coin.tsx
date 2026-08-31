// 達成コイン (2026-08-30 Tetsuo承認)。点数刻印なし・アルコ(05B)を金彫刻風に沈める。
// 使い所: マイランクカードの演奏の軌跡シート / 獲得モーション (CoinCelebration)。
// 見た目の正 = coin-motions.html モックの .coin 一式 (Coin.module.css に移植済)。
import styles from "./Coin.module.css"

export default function Coin({ size, star, master }: {
  size: number
  /** 曲の★数 → 上弧の★刻印 (2026-08-31 承認済み変種: 色ではなく刻印数で表す) */
  star?: number
  /** マスター進化: 放射の輝き+二重リム+銘がMASTERに */
  master?: boolean
}) {
  return (
    <span
      className={`${styles.coin} ${master ? styles.master : ""}`}
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(5, Math.round(size * 0.11)) }}
    >
      <span className={styles.tilt}>
        <span className={styles.edge} />
        <span className={styles.face}>
          <span className={styles.rim} />
          {star != null && star > 0 && <span className={styles.pips}>{"★".repeat(Math.min(star, 5))}</span>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* 彫刻アルコ: 演出中の出現に間に合うよう eager (lazyだとポップ時に未ロードで無地になる) */}
          <img className={styles.arco} src="/arco/05B.jpg" alt="" />
          <span className={styles.mark}>{master ? "master" : "achieved"}</span>
          <span className={styles.sheen} />
          <span className={styles.grain} />
        </span>
        <span className={styles.gloss} />
      </span>
    </span>
  )
}
