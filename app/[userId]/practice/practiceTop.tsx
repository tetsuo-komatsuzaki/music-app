"use client"

import Link from "next/link"
import styles from "./practice.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"
import {
  PRACTICE_TOP_GROUPS,
  categoryLabel,
  categoryIcon,
} from "@/app/_libs/practiceConstants"

// UI-12 (§8 D3): カード由来の遷移時に渡されるコンテクスト
export type CardContext = {
  cardId: string
  /** 「{subTaskName} の教材」の {subTaskName} 部分 */
  contextLabel: string
  recommendations: Array<{
    id: string
    title: string
    category: string
    star: number | null
    composer: string | null
    reason: string
    href: string
  }>
}

// §9「この曲を上達させる練習」: 曲ごとに、その曲の課題に紐づく基礎練/エチュード
export type SongPracticeGroup = {
  scoreId: string
  scoreTitle: string
  items: {
    itemId: string
    title: string
    category: string
    categoryLabel: string
  }[]
}

export type PieceScore = {
  id: string
  title: string
  composer: string | null
  star: number | null
}

type Props = {
  userId: string
  /** category(基礎練6 + etude) → 件数 */
  categoryCounts: Record<string, number>
  /** 練習曲 = 公開教材(isShared Score) */
  pieceScores: PieceScore[]
  /** §9 この曲を上達させる練習 */
  songPracticeGroups: SongPracticeGroup[]
  /** UI-12: /practice?fromCard=&context=etude で遷移してきた場合のコンテクスト */
  cardContext: CardContext | null
}

export default function PracticeTop({
  userId,
  categoryCounts,
  pieceScores,
  songPracticeGroups,
  cardContext,
}: Props) {
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

      {/* §9 この曲を上達させる練習 (旧「おすすめ練習」の置き換え) */}
      {songPracticeGroups.length > 0 && (
        <section className={styles.recommendSection}>
          <h2 className={styles.sectionTitle}>この曲を上達させる練習</h2>
          {songPracticeGroups.map(group => (
            <div key={group.scoreId} className={styles.recommendCard}>
              <div className={styles.recommendReason}>
                「{group.scoreTitle}」をよりうまくなるために、次を練習しましょう
              </div>
              <div className={styles.recommendItems}>
                {group.items.map(item => (
                  <Link
                    key={item.itemId}
                    href={`/${userId}/practice/${item.category}/${item.itemId}`}
                    className={styles.recommendChip}
                  >
                    {item.categoryLabel}: {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 基礎練 / エチュード グループ (基礎練は6カードをインライン表示) */}
      {PRACTICE_TOP_GROUPS.map(group => (
        <section
          key={group.key}
          className={styles.categorySection}
          data-onboarding={group.key === "basic" ? "practice.categoryNav" : undefined}
        >
          <h2 className={styles.sectionTitle}>{group.label}</h2>
          <div className={styles.categoryGrid}>
            {group.categories.map(cat => (
              <Link
                key={cat}
                href={`/${userId}/practice/${cat}`}
                className={styles.categoryCard}
              >
                <div className={styles.categoryIcon}>{categoryIcon(cat)}</div>
                <div className={styles.categoryName}>{categoryLabel(cat)}</div>
                <div className={styles.categoryCount}>
                  {categoryCounts[cat] ?? 0}項目
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 練習曲 (公開教材 = isShared Score) */}
      <section className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>練習曲</h2>
        {pieceScores.length === 0 ? (
          <p className={styles.cardContextEmpty}>
            公開されている練習曲はまだありません。
          </p>
        ) : (
          <div className={styles.cardContextList}>
            {pieceScores.map(score => (
              <Link
                key={score.id}
                href={`/${userId}/scores/${score.id}`}
                className={styles.cardContextItem}
              >
                <div className={styles.cardContextItemTitle}>
                  {score.title}
                  {score.star != null && ` ☆${score.star}`}
                </div>
                {score.composer && (
                  <div className={styles.cardContextItemComposer}>
                    {score.composer}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <OnboardingTrigger pageKey="practice" />
    </div>
  )
}
