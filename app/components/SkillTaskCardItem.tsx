// app/components/SkillTaskCardItem.tsx
//
// UI 設計書 v3.1 §7-4 / 2026-05-10 リデザイン:
//
// 畳み時 (collapsed):
//   - カードタイトル (subTaskName / taskName)
//   - 平均スコア: {N} 点
//   - 達成経過 (3 行) または 達成ボタン (達成基準を満たすと切替)
//   - ▼ アイコン
//
// 展開時 (expanded):
//   - 改善のヒント (sub_task のみ improvementGuide.awareness)
//   - [ピンポイント練習(音階)] [ピンポイント練習(アルペジオ)] [このエチュードで練習する]
//
// 達成基準 (Q3:D):
//   - 推薦音階の練習回数 ≥ 10
//   - 推薦アルペジオの練習回数 ≥ 10
//   - 推薦エチュード直近 5 回サブタスクスコア平均 ≥ 85
//
// 状態別の左ボーダー: active=赤系、improving=橙系、cleared=緑系。

"use client"

import Link from "next/link"
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
  // 中項目→難易度グルーピング + 達成基準 (Q3:D) 用の augmentation
  cardDifficulty: number | null
  recommendedScale: { id: string; title: string } | null
  recommendedArpeggio: { id: string; title: string } | null
  recommendedEtude: { id: string; title: string } | null
  scalePracticeCount: number
  arpeggioPracticeCount: number
  etudePracticeCount: number
  etudeRecentAvgScore: number | null
  achievementMet: boolean
}

const SCALE_THRESHOLD = 10
const ARPEGGIO_THRESHOLD = 10

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

export default function SkillTaskCardItem({
  card,
  averageScore,
  expanded,
  userId,
  onToggle,
  onClear,
}: Props) {
  // 改善のヒント (sub_task カードのみ。task カードは null)
  const awareness =
    card.cardType === "sub_task" && isSubTaskId(card.skillSubTaskId)
      ? SKILL_SUB_TASKS[card.skillSubTaskId].improvementGuide.awareness
      : null

  const isActiveLike = card.status === "active" || card.status === "improving"
  const showAchievementSection = isActiveLike && card.cardType === "sub_task"

  // 推薦アイテム未紐付けの場合は category top page にフォールバック
  const scaleHref = card.recommendedScale
    ? `/${userId}/practice/scale/${card.recommendedScale.id}`
    : `/${userId}/practice/scale`
  const arpeggioHref = card.recommendedArpeggio
    ? `/${userId}/practice/arpeggio/${card.recommendedArpeggio.id}`
    : `/${userId}/practice/arpeggio`
  const etudeHref = card.recommendedEtude
    ? `/${userId}/practice/etude/${card.recommendedEtude.id}`
    : `/${userId}/practice/etude`

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

      {/* 達成経過 / 達成ボタン (sub_task カード active/improving のみ、ヘッダー外に配置) */}
      {showAchievementSection && (
        <div className={styles.achievementSection}>
          {card.achievementMet ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={onClear}
            >
              ✓ 達成した！
            </button>
          ) : (
            <ul className={styles.progressList}>
              <li>
                音階練習回数:{" "}
                <strong>{card.scalePracticeCount}</strong>/{SCALE_THRESHOLD}回
              </li>
              <li>
                アルペジオ練習回数:{" "}
                <strong>{card.arpeggioPracticeCount}</strong>/{ARPEGGIO_THRESHOLD}回
              </li>
              <li>
                エチュード: スコア{" "}
                <strong>
                  {card.etudeRecentAvgScore != null
                    ? Math.round(card.etudeRecentAvgScore)
                    : "—"}
                </strong>
                点、練習回数 <strong>{card.etudePracticeCount}</strong>回
              </li>
            </ul>
          )}
        </div>
      )}

      {expanded && (
        <div className={styles.detail} id={`card-detail-${card.id}`}>
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
            <Link
              href={scaleHref}
              className={styles.etudeButton}
              title="該当する音階のスコア詳細に遷移"
            >
              ピンポイント練習(音階)
            </Link>
            <Link
              href={arpeggioHref}
              className={styles.etudeButton}
              title="該当するアルペジオのスコア詳細に遷移"
            >
              ピンポイント練習(アルペジオ)
            </Link>
            <Link
              href={etudeHref}
              className={styles.etudeButton}
              title="該当するエチュードのスコア詳細に遷移"
            >
              このエチュードで練習する
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}
