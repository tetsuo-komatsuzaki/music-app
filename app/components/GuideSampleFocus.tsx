"use client"

// 画面ガイド用の「見本」いま練習している曲 (2026-07-25)
//
// まだ1曲も弾いていないユーザーには、ホームの「いま練習している曲」カードが
// そもそも存在しない。ガイドは「弾いた曲はこの画面にも出るよ」「クリア条件は…」
// と説明するので、対象が無いままだと何を指しているのか分からない。
// ガイド表示中だけ見本を出して、弾いたあとのホームがどうなるかを見せる。
//
// ふりかえりの見本 (GuideSampleReview) と同じ扱い。本物と誤解されないよう明示する。

import styles from "./GuideSampleReview.module.css"
import hb from "../[userId]/homeBlocks.module.css"

const DAILY_GOAL = 3

type SamplePiece = { title: string; cover: string | null; star: number | null }

export default function GuideSampleFocus({ piece }: { piece?: SamplePiece }) {
  const title = piece?.title ?? "きらきら星"
  const cover = piece?.cover ?? null
  const star = piece?.star ?? 1
  const step = (done: boolean, label: string, metric: string) => (
    <div className={`${hb.step} ${done ? hb.stepDone : ""}`} key={label}>
      <span className={hb.stepCk}>{done ? "✓" : ""}</span>
      <span className={hb.stepLabel}>{label}</span>
      <span className={hb.stepMetric}>{metric}</span>
    </div>
  )

  return (
    <div className={styles.wrap} data-onboarding="home.focusCard" aria-label="ガイド用の見本">
      <div className={styles.badge}>見本 ・ 弾くとこう出るよ</div>

      <div className={hb.cardTitle}>いま練習している曲</div>

      <div className={hb.piece}>
        <div className={`${hb.thumb} ${hb.thumbGoal}`}>{cover ? <img src={cover} alt="" loading="lazy" /> : "♪"}</div>
        <div className={hb.g}>
          <div className={hb.title}>{title}</div>
          <div className={hb.meta}>☆{star} ・ 直近 82点</div>
        </div>
        <span className={`${hb.chip} ${hb.chipGoal}`}>挑戦中</span>
      </div>

      <div className={hb.mastery}>
        <div className={hb.mrow}>
          <span>演奏マスターまで</span>
          <span><b>82</b> / 90点</span>
        </div>
        <div className={hb.mbar}><i style={{ width: "91%" }} /></div>
      </div>

      <div className={hb.rec2}>
        <div className={hb.recCol}>
          <div className={`${hb.recH} ${hb.recHPiece}`}><span className={hb.dot} />マスターへのステップ</div>
          {step(false, "音程とリズムの平均90点", "82")}
          {step(false, "通し演奏", `1/${DAILY_GOAL}`)}
          {step(true, "学びレッスン", "2/2")}
        </div>
        <div className={hb.recCol} data-onboarding="home.focusDaily">
          <div className={`${hb.recH} ${hb.recHDaily}`}><span className={hb.dot} />毎日の基礎練</div>
          {step(true, "音階", `3/${DAILY_GOAL}`)}
          {step(false, "アルペジオ", `1/${DAILY_GOAL}`)}
        </div>
      </div>

      <p className={styles.note}>
        ここは見本だよ。1曲でも弾くと、きみの曲とクリアまでの進み具合がここに出るようになる。
      </p>
    </div>
  )
}
