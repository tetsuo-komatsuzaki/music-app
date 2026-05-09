// app/components/RecommendationList.tsx
//
// UI 設計書 v3.1 §6-4 — ホーム画面「次のチャレンジ」横スクロールリスト。
//
// レイアウト:
//   - 横スクロール (スクロールスナップ付き)
//   - 1 画面に 1.2-1.5 個見える幅
//   - スクロールバーは控えめ
//   - 空ケースは「現在のおすすめは準備中です」+ 補足文

"use client"

import RecommendationItem, {
  type SongRecommendation,
} from "./RecommendationItem"
import styles from "./RecommendationList.module.css"

type Props = {
  recommendations: SongRecommendation[]
  /** 空状態メッセージのカスタマイズ (Â§6-10 文言確定) */
  emptyTitle?: string
  emptyDescription?: string
}

export default function RecommendationList({
  recommendations,
  emptyTitle,
  emptyDescription,
}: Props) {
  if (recommendations.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <div className={styles.emptyTitle}>
          {emptyTitle ?? "現在のおすすめは準備中です"}
        </div>
        <div className={styles.emptyDescription}>
          {emptyDescription ??
            "演奏を重ねるとあなたに合ったおすすめが表示されます。"}
        </div>
      </div>
    )
  }

  return (
    <div
      className={styles.scroll}
      role="list"
      aria-label="次のチャレンジリスト"
    >
      {recommendations.map(rec => (
        <div role="listitem" key={rec.practiceItem.id}>
          <RecommendationItem recommendation={rec} />
        </div>
      ))}
    </div>
  )
}
