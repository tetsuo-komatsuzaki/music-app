// app/components/SkillTaskCardItem.tsx
//
// UI 設計書 v3.1 §7-4 — マイページの 1 件分カード (collapsed/expanded inline)。
//
// 畳み時 (collapsed):
//   - カードタイトル (subTaskName / taskName)
//   - 平均スコア: {N} 点
//   - ▼ アイコン
//
// 展開時 (expanded):
//   - 平均スコア
//   - 最終検出: 〇日前 (lastMatchedAt)
//   - 改善のヒント (sub_task のみ improvementGuide.awareness)
//   - [この教材で練習する]   ← F2 で MVP 有効化、fetch + navigate
//   - [ピンポイント練習(準備中)] ← C7 disabled
//   - [達成した！]            ← C6 ワンタップ即遷移、active/improving のみ
//
// 状態別の左ボーダー: active=赤系、improving=橙系、cleared=緑系。

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  SKILL_SUB_TASKS,
  type SubTaskId,
  SUB_TASK_IDS,
} from "@/app/_libs/skillMaster"
import styles from "./SkillTaskCardItem.module.css"

export type SkillTaskCardData = {
  id: string
  cardType: "task" | "sub_task"
  skillTaskId: string | null
  skillSubTaskId: string | null
  status: "active" | "improving" | "cleared"
  createdAt: string
  improvedAt: string | null
  clearedAt: string | null
  lastMatchedAt: string | null
  displayName: string
  parentTaskName: string
}

type Props = {
  card: SkillTaskCardData
  /** sub_task なら averageScore (UserSkillSubScore) / task なら currentScore (UserSkillScore) */
  averageScore: number | null
  expanded: boolean
  userId: string
  onToggle: () => void
  /** 「達成した！」ボタン押下時 (active/improving 時のみ表示)。
   *  親が楽観的更新 + API call を担当。 */
  onClear: () => void
}

const isSubTaskId = (v: unknown): v is SubTaskId =>
  typeof v === "string" && (SUB_TASK_IDS as readonly string[]).includes(v)

function relativeTime(isoStr: string | null): string {
  if (!isoStr) return "—"
  const diff = Date.now() - new Date(isoStr).getTime()
  if (diff < 0) return "たった今"
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 7) return `${days}日前`
  return new Date(isoStr).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
  })
}

export default function SkillTaskCardItem({
  card,
  averageScore,
  expanded,
  userId,
  onToggle,
  onClear,
}: Props) {
  const router = useRouter()
  const [etudeLoading, setEtudeLoading] = useState(false)
  const [etudeError, setEtudeError] = useState<string | null>(null)

  // 改善のヒント (sub_task カードのみ。task カードは null)
  const awareness =
    card.cardType === "sub_task" && isSubTaskId(card.skillSubTaskId)
      ? SKILL_SUB_TASKS[card.skillSubTaskId].improvementGuide.awareness
      : null

  const showClearButton = card.status === "active" || card.status === "improving"

  const handleEtudeClick = async () => {
    if (etudeLoading) return
    setEtudeLoading(true)
    setEtudeError(null)
    try {
      const res = await fetch(
        `/api/skill-task-cards/${card.id}/recommendations/etudes?limit=1`,
      )
      if (!res.ok) {
        setEtudeError(`教材を取得できませんでした (HTTP ${res.status})`)
        return
      }
      const data = (await res.json()) as {
        recommendations: Array<{
          practiceItem: { id: string; category: string; title: string }
        }>
      }
      if (!data.recommendations || data.recommendations.length === 0) {
        setEtudeError("おすすめ教材が見つかりませんでした")
        return
      }
      const item = data.recommendations[0].practiceItem
      router.push(`/${userId}/practice/${item.category}/${item.id}`)
    } catch (e) {
      setEtudeError(
        `教材を取得できませんでした (${e instanceof Error ? e.message : String(e)})`,
      )
    } finally {
      setEtudeLoading(false)
    }
  }

  return (
    <article
      className={`${styles.card} ${styles[`status_${card.status}`]}`}
      data-expanded={expanded ? "true" : undefined}
    >
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`card-detail-${card.id}`}
      >
        <div className={styles.headerMain}>
          <div className={styles.titleRow}>
            <span className={styles.parentTask}>{card.parentTaskName}</span>
            <h3 className={styles.title}>{card.displayName}</h3>
          </div>
          <div className={styles.score}>
            平均スコア:{" "}
            <span className={styles.scoreValue}>
              {averageScore != null ? Math.round(averageScore) : "—"}
            </span>{" "}
            点
          </div>
        </div>
        <span className={styles.toggleIcon} aria-hidden="true">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className={styles.detail} id={`card-detail-${card.id}`}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>最終検出:</span>{" "}
            <span className={styles.metaValue}>
              {relativeTime(card.lastMatchedAt)}
            </span>
          </div>

          {awareness && (
            <div className={styles.hint}>
              <div className={styles.hintTitle}>
                <span aria-hidden="true">🎯</span> 改善のヒント
              </div>
              <div className={styles.hintBody}>
                <strong>{awareness.title}</strong>
                <p>{awareness.description}</p>
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.etudeButton}
              onClick={handleEtudeClick}
              disabled={etudeLoading}
              aria-busy={etudeLoading}
            >
              {etudeLoading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  読み込み中...
                </>
              ) : (
                "この教材で練習する"
              )}
            </button>

            <button
              type="button"
              className={styles.pinpointButton}
              disabled
              aria-disabled="true"
              title="ピンポイント練習は β 以降で利用可能になります"
            >
              ピンポイント練習（準備中）
            </button>

            {showClearButton && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={onClear}
              >
                ✓ 達成した！
              </button>
            )}
          </div>

          {etudeError && (
            <div className={styles.errorMessage} role="alert">
              {etudeError}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
