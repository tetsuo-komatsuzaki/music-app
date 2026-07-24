"use client"

// 画面ガイド用の「見本」ふりかえり (2026-07-25)
//
// まだ1回も演奏していないユーザーは、ふりかえり画面が空っぽなので
// 「弾いたら何が返ってくるのか」が伝わらない。ガイド表示中だけ、
// 採点結果とおすすめ練習の見本を出して、体験の見通しを持ってもらう。
//
// 本物の記録と誤解されないよう、見本であることを常に明示する。
// 表示するかどうかは OnboardingProvider の guideSample が決める。

import styles from "./GuideSampleReview.module.css"

export default function GuideSampleReview() {
  return (
    <div className={styles.wrap} aria-label="ガイド用の見本">
      <div className={styles.badge}>見本 ・ 弾くとこう出るよ</div>

      <div className={styles.scoreRow}>
        <div className={styles.big}>
          82<span className={styles.unit}>点</span>
        </div>
        <div className={styles.subs}>
          <div className={styles.sub}><span className={styles.dotP} />音程 <b>86</b></div>
          <div className={styles.sub}><span className={styles.dotR} />リズム <b>78</b></div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.secTitle}>今回の学びポイントと練習メニュー</div>
        <div className={styles.slot}>
          <span className={styles.tree}>リズム</span>
          <span className={styles.slotName}>🎯 付点のリズム</span>
          <span className={styles.pct}>ミス 31%</span>
        </div>
        <div className={styles.breakdown}>付点のあとの短い音が、少し長めになっているよ。</div>

        <div className={styles.matLabel}>おすすめ教材</div>
        <div className={styles.mat}>
          <span className={styles.matTitle}>付点のリズム練習</span>
          <span className={styles.matGo}>練習する →</span>
        </div>
        <div className={styles.mat}>
          <span className={styles.matTitle}>音階 ト長調 1オクターブ</span>
          <span className={styles.matGo}>練習する →</span>
        </div>
      </div>

      <p className={styles.note}>
        ここは見本だよ。1回でも録音すると、きみの演奏でこの内容が出るようになる。
      </p>
    </div>
  )
}
