// app/components/ImprovementGuideCard.tsx
//
// UI 設計書 v3 §5-6 / §5-12 — 改善アドバイスカード
//
// 表示制御:
//   - improvementGuides 配列を順番にレンダリング (UI 側では絞り込まない)
//   - 各 ImprovementGuideEntry を 1 カード化
//   - 1 カード内に awareness / practice / etudeRecommendation を縦並びで常時展開
//   - 「この教材で練習する」ボタンは MVP では disabled (cardId が API 未提供)
//   - improvementGuides が空なら祝福メッセージを表示
//
// データ層への要望 (設計書 §5-15):
//   - improvementGuides[].cardId を skill-detail レスポンスに追加
//   - GET /api/skill-task-cards/[cardId]/recommendations/etudes の実装
//   → これらが揃ったら β 以降の別 PR で「準備中」を解除する。

"use client"

import type {
  ImprovementGuideEntry,
  ImprovementMethod,
} from "./PerformanceSkillDetail"
import styles from "./ImprovementGuideCard.module.css"

type Props = {
  guides: ImprovementGuideEntry[]
}

function MethodSection({
  icon,
  label,
  method,
}: {
  icon: string
  label: string
  method: ImprovementMethod
}) {
  const hasSteps = Array.isArray(method.steps) && method.steps.length > 0
  return (
    <section className={styles.methodSection}>
      <h4 className={styles.methodHeading}>
        <span className={styles.methodIcon} aria-hidden="true">
          {icon}
        </span>
        {label}
      </h4>
      <div className={styles.methodTitle}>{method.title}</div>
      {hasSteps ? (
        <ol className={styles.methodSteps}>
          {method.steps!.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      ) : (
        <p className={styles.methodDescription}>{method.description}</p>
      )}
    </section>
  )
}

function GuideCard({ entry }: { entry: ImprovementGuideEntry }) {
  const { guide } = entry
  const practiceLabel =
    guide.practice.durationMinutes != null
      ? `練習方法（${guide.practice.durationMinutes}分）`
      : "練習方法"

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.parentTaskBadge}>{entry.parentTaskName}</span>
        <h3 className={styles.subTaskName}>{entry.subTaskName}</h3>
      </header>

      <MethodSection icon="🎯" label="意識する" method={guide.awareness} />
      <MethodSection icon="🎵" label={practiceLabel} method={guide.practice} />
      <MethodSection
        icon="📚"
        label="おすすめ教材"
        method={guide.etudeRecommendation}
      />

      <div className={styles.etudeButtonRow}>
        <button
          type="button"
          className={styles.etudeButton}
          disabled
          aria-disabled="true"
          title="教材レコメンドは β 以降で利用可能になります"
        >
          この教材で練習する（準備中）
        </button>
      </div>
    </article>
  )
}

export default function ImprovementGuideCard({ guides }: Props) {
  if (guides.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        素晴らしい演奏でした！次のチャレンジに進みましょう
      </div>
    )
  }
  return (
    <div className={styles.list}>
      {guides.map(entry => (
        <GuideCard key={entry.subTaskId} entry={entry} />
      ))}
    </div>
  )
}
