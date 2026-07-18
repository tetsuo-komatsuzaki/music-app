"use client"

import Link from "next/link"
import styles from "./practice.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"
import PracticeCatIcon from "./PracticeCatIcon"
import {
  PRACTICE_TOP_GROUPS,
  categoryLabel,
} from "@/app/_libs/practiceConstants"

// C-6b掃除 (2026-07-11): 旧カード由来コンテクスト(UI-12)と
// 「この曲を上達させる練習」(旧SkillTaskCard §9) は撤去。
// 弱点由来の練習導線はホーム累積弱点(窓②)と演奏直後の推薦(窓①)が担う。

type Props = {
  userId: string
  /** category(基礎練6 + etude) → 件数 */
  categoryCounts: Record<string, number>
  /** 練習曲(公開教材 isShared Score) の件数。一覧は /practice/pieces へ。 */
  pieceCount: number
  /** 学びのレッスンのクリア数/全数。一覧は /lessons へ。 */
  lessonProgress: { cleared: number; total: number }
}

export default function PracticeTop({
  userId,
  categoryCounts,
  pieceCount,
  lessonProgress,
}: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習メニュー</h1>

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
                <PracticeCatIcon cat={cat} />
                <div className={styles.categoryName}>{categoryLabel(cat)}</div>
                <div className={styles.categoryCount}>
                  {categoryCounts[cat] ?? 0}項目
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* 練習曲 (公開教材) — 一覧ページ /practice/pieces へ遷移 */}
      <section className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>練習曲</h2>
        <div className={styles.categoryGrid}>
          <Link
            href={`/${userId}/practice/pieces`}
            className={styles.categoryCard}
          >
            <PracticeCatIcon cat="pieces" />
            <div className={styles.categoryName}>練習曲一覧</div>
            <div className={styles.categoryCount}>{pieceCount}曲</div>
          </Link>
        </div>
      </section>

      {/* 学びのレッスン — 技術の導入レッスン一覧 /lessons へ遷移 */}
      <section className={styles.categorySection}>
        <h2 className={styles.sectionTitle}>学びのレッスン</h2>
        <div className={styles.categoryGrid}>
          <Link href={`/${userId}/lessons`} className={styles.categoryCard}>
            <PracticeCatIcon cat="lessons" />
            <div className={styles.categoryName}>学びのレッスン</div>
            <div className={styles.categoryCount}>
              クリア {lessonProgress.cleared} / {lessonProgress.total}
            </div>
          </Link>
        </div>
      </section>

      <OnboardingTrigger pageKey="practice" />
    </div>
  )
}
