"use client"

import Link from "next/link"
import styles from "./practice.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"

type RecommendItem = {
  id: string
  title: string
  category: string
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
}

const categoryLabels: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  etude: "エチュード",
}


export default function PracticeTop({
  userId, categoryCounts, scoreRecommendations, weaknessRecommendations,
}: Props) {
  const hasRecommendations = scoreRecommendations.length > 0 || weaknessRecommendations.length > 0

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習メニュー</h1>

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
