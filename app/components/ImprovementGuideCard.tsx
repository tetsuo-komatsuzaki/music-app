// app/components/ImprovementGuideCard.tsx
//
// UI 設計書 v3 §5-6 / §5-12 / v3.1 §15-2 (F2) — 改善アドバイスカード
//
// 表示制御:
//   - improvementGuides 配列を順番にレンダリング (UI 側では絞り込まない)
//   - 各 ImprovementGuideEntry を 1 カード化
//   - 1 カード内に awareness / practice / etudeRecommendation を縦並びで常時展開
//   - improvementGuides が空なら祝福メッセージを表示
//
// 「この教材で練習する」ボタン (UI-13 / F2 / UI-12 §8):
//   - cardId + userId が揃っていればクリック可。
//   - 遷移先: /{userId}/practice?fromCard={cardId}&context=etude
//     → /practice 画面が「{subTaskName} の教材」コンテクストとレコメンド一覧を表示
//   - 旧実装は ?limit=1 で先頭 practiceItem に直接遷移していたが、
//     UI-12 §8 (D3) で list 表示に変更。ユーザーが選べるようにする。
//   - cardId が null または userId が未提供なら「準備中」disabled

"use client"

import Link from "next/link"
import type {
  ImprovementGuideEntry,
  ImprovementMethod,
} from "./PerformanceSkillDetail"
import styles from "./ImprovementGuideCard.module.css"

type Props = {
  guides: ImprovementGuideEntry[]
  /** UI-13: 教材ボタン押下時の navigation 用 supabaseUserId。
   *  未提供時はボタン無効化。 */
  userId?: string
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

function GuideCard({
  entry,
  userId,
}: {
  entry: ImprovementGuideEntry
  userId?: string
}) {
  const { guide } = entry
  const practiceLabel =
    guide.practice.durationMinutes != null
      ? `練習方法（${guide.practice.durationMinutes}分）`
      : "練習方法"

  const canNavigate = !!entry.cardId && !!userId
  const etudeHref = canNavigate
    ? `/${userId}/practice?fromCard=${entry.cardId}&context=etude`
    : null

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
        {etudeHref ? (
          <Link
            href={etudeHref}
            className={styles.etudeButton}
            title="おすすめ教材ページに移動します"
          >
            この教材で練習する
          </Link>
        ) : (
          <button
            type="button"
            className={styles.etudeButton}
            disabled
            aria-disabled="true"
            title="教材レコメンドの準備中です"
          >
            この教材で練習する（準備中）
          </button>
        )}
      </div>
    </article>
  )
}

export default function ImprovementGuideCard({ guides, userId }: Props) {
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
        <GuideCard key={entry.subTaskId} entry={entry} userId={userId} />
      ))}
    </div>
  )
}
