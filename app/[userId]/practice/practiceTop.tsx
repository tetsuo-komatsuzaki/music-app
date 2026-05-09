"use client"

import Link from "next/link"
import styles from "./practice.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"

type RecommendItem = {
  id: string
  title: string
  category: string
}

// UI-12 (§8 D3): カード由来の遷移時に渡されるコンテクスト
export type CardContext = {
  cardId: string
  /** 「{subTaskName} の教材」の {subTaskName} 部分 */
  contextLabel: string
  recommendations: Array<{
    id: string
    title: string
    category: string
    difficulty: number | null
    composer: string | null
    reason: string
    href: string
  }>
}

type Props = {
  userId: string
  categoryCounts: { scale: number; arpeggio: number; etude: number }
  scoreRecommendations: {
    scoreTitle: string
    reason: string
    items: RecommendItem[]
  }[]
  weaknessRecommendations: {
    reason: string
    items: RecommendItem[]
  }[]
  /** UI-12 (§8): /practice?fromCard=&context=etude で遷移してきた場合のコンテクスト */
  cardContext: CardContext | null
}

const categoryLabels: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  etude: "エチュード",
}


export default function PracticeTop({
  userId, categoryCounts, scoreRecommendations, weaknessRecommendations, cardContext,
}: Props) {
  const hasRecommendations = scoreRecommendations.length > 0 || weaknessRecommendations.length > 0

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習メニュー</h1>

      {/* UI-12 (§8 D3): カード由来コンテクスト表示 */}
      {cardContext && (
        <section className={styles.cardContextSection}>
          <h2 className={styles.cardContextTitle}>
            「{cardContext.contextLabel}」の教材
          </h2>
          {cardContext.recommendations.length === 0 ? (
            <div className={styles.cardContextEmpty}>
              該当する教材が見つかりませんでした。
            </div>
          ) : (
            <div className={styles.cardContextList}>
              {cardContext.recommendations.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={styles.cardContextItem}
                >
                  <div className={styles.cardContextItemTitle}>{item.title}</div>
                  {item.composer && (
                    <div className={styles.cardContextItemComposer}>
                      {item.composer}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {hasRecommendations && (
        <section className={styles.recommendSection}>
          <h2 className={styles.sectionTitle}>おすすめ練習</h2>

          {scoreRecommendations.map((rec, i) => (
            <div key={`score-${i}`} className={styles.recommendCard}>
              <div className={styles.recommendLabel}>📋 あなたの楽曲から</div>
              <div className={styles.recommendReason}>{rec.reason}</div>
              <div className={styles.recommendItems}>
                {rec.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${userId}/practice/${item.category}/${item.id}`}
                    className={styles.recommendChip}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {weaknessRecommendations.map((rec, i) => (
            <div key={`weakness-${i}`} className={styles.recommendCard}>
              <div className={styles.recommendLabel}>🎯 あなたの苦手から</div>
              <div className={styles.recommendReason}>{rec.reason}</div>
              <div className={styles.recommendItems}>
                {rec.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${userId}/practice/${item.category}/${item.id}`}
                    className={styles.recommendChip}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className={styles.categorySection} data-onboarding="practice.categoryNav">
        <div className={styles.categoryGrid}>
          {(["scale", "arpeggio", "etude"] as const).map((cat) => (
            <Link
              key={cat}
              href={`/${userId}/practice/${cat}`}
              className={styles.categoryCard}
            >
              <div className={styles.categoryIcon}>
                {cat === "scale" ? "🎵" : cat === "arpeggio" ? "🎶" : "📖"}
              </div>
              <div className={styles.categoryName}>{categoryLabels[cat]}</div>
              <div className={styles.categoryCount}>
                {categoryCounts[cat]}項目
              </div>
            </Link>
          ))}
        </div>
      </section>

      <OnboardingTrigger pageKey="practice" />
    </div>
  )
}
