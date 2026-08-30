// 達成コイン (2026-08-30 Tetsuo承認)。点数刻印なし・アルコ(05B)を金彫刻風に沈める。
// 使い所: マイランクカードの演奏の軌跡シート / 獲得モーション (CoinCelebration)。
// 見た目の正 = coin-motions.html モックの .coin 一式 (Coin.module.css に移植済)。
import styles from "./Coin.module.css"

export default function Coin({ size }: { size: number }) {
  return (
    <span
      className={styles.coin}
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(5, Math.round(size * 0.11)) }}
    >
      <span className={styles.tilt}>
        <span className={styles.edge} />
        <span className={styles.face}>
          <span className={styles.rim} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* 彫刻アルコ: 演出中の出現に間に合うよう eager (lazyだとポップ時に未ロードで無地になる) */}
          <img className={styles.arco} src="/arco/05B.jpg" alt="" />
          <span className={styles.mark}>achieved</span>
          <span className={styles.sheen} />
          <span className={styles.grain} />
        </span>
        <span className={styles.gloss} />
      </span>
    </span>
  )
}
