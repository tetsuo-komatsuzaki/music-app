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
// 「この教材で練習する」ボタン (UI-13 / F2):
//   - cardId + userId が揃っていればクリック可。
//     fetch /api/skill-task-cards/{cardId}/recommendations/etudes?limit=1
//     → 先頭の practiceItem に navigate /{userId}/practice/{category}/{id}
//   - cardId が null または userId が未提供なら「準備中」disabled

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canNavigate = !!entry.cardId && !!userId

  const handleEtudeClick = async () => {
    if (!canNavigate || loading) return
    if (!entry.cardId || !userId) return // 型ガード (canNavigate と同等)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/skill-task-cards/${entry.cardId}/recommendations/etudes?limit=1`,
      )
      if (!res.ok) {
        setError(`教材を取得できませんでした (HTTP ${res.status})`)
        return
      }
      const data = (await res.json()) as {
        recommendations: Array<{
          practiceItem: { id: string; category: string; title: string }
        }>
      }
      if (!data.recommendations || data.recommendations.length === 0) {
        setError("おすすめ教材が見つかりませんでした")
        return
      }
      const item = data.recommendations[0].practiceItem
      router.push(`/${userId}/practice/${item.category}/${item.id}`)
    } catch (e) {
      setError(`教材を取得できませんでした (${e instanceof Error ? e.message : String(e)})`)
    } finally {
      setLoading(false)
    }
  }

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
          onClick={handleEtudeClick}
          disabled={!canNavigate || loading}
          aria-disabled={!canNavigate || loading}
          aria-busy={loading}
          title={
            !canNavigate
              ? "教材レコメンドの準備中です"
              : "おすすめ教材ページに移動します"
          }
        >
          {loading ? (
            <>
              <span className={styles.spinner} aria-hidden="true" />
              読み込み中...
            </>
          ) : canNavigate ? (
            "この教材で練習する"
          ) : (
            "この教材で練習する（準備中）"
          )}
        </button>
      </div>
      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
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
