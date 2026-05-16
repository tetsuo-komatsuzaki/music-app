// app/components/ProblematicPositionList.tsx
//
// UI 設計書 v3 §5-4 / §5-5 / §5-12 — 気になる箇所リスト + 候補選択
//
// 動作:
//   - severity 降順 (API 側で済) で渡された positions をそのまま列挙
//   - 1 件のカードに「第 X 小節 Y 拍目」「候補: A, B」と 3 ボタン
//   - カードタップで onJumpToPosition(note_indices) を発火 → 譜面ジャンプ + ハイライト
//   - 「✓ これだ」: 候補 1 件なら即送信、2 件以上なら CandidatePickerModal を開く
//   - 「違う」「? 分からない」: 即送信
//   - 楽観的更新 (Map<positionId, LocalFeedback>) でマーク表示
//   - 送信済みでも再選択可 (誤タップ修正、設計書 §5-5)
//   - 空ケース: 「気になる箇所はありません」+「素晴らしい演奏でした！」

"use client"

import { useState } from "react"
import {
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  type SubTaskId,
} from "@/app/_libs/skillMaster"
import type { ProblematicPosition } from "./PerformanceSkillDetail"
import CandidateSelector, { type LocalFeedback } from "./CandidateSelector"
import CandidatePickerModal from "./CandidatePickerModal"
import styles from "./ProblematicPositionList.module.css"

type Props = {
  performanceId: string
  /** v1.6 Phase 4-4: feedback POST 先を切替。"score" は Score 演奏。デフォルト "practice"。 */
  kind?: "practice" | "score"
  positions: ProblematicPosition[]
  /** 譜面ジャンプ + ハイライト連携。指定なしなら位置タップ動作を無効化。 */
  onJumpToPosition?: (noteIndices: number[]) => void
}

const isSubTaskId = (v: unknown): v is SubTaskId =>
  typeof v === "string" && (SUB_TASK_IDS as readonly string[]).includes(v)

function formatPosition(p: ProblematicPosition): string {
  const { measure_start, beat_start, measure_end, beat_end } = p
  if (measure_start === measure_end && beat_start === beat_end) {
    return `第 ${measure_start} 小節 ${beat_start} 拍目`
  }
  if (measure_start === measure_end) {
    return `第 ${measure_start} 小節 ${beat_start}〜${beat_end} 拍目`
  }
  return `第 ${measure_start} 小節 ${beat_start} 拍目〜第 ${measure_end} 小節 ${beat_end} 拍目`
}

function candidateName(id: string): string {
  if (isSubTaskId(id)) return SUB_TASK_NAMES[id]
  return id // 未知 ID はそのまま表示 (skillMaster 拡張時の保険)
}

// UI-14 (F8): features 配列の値を日本語ラベルに変換。
// score_full の lib/problematic_positions.py が返す値は 4 種類固定:
//   "string_change" / "in_slur" / "after_rest" / "high_pitch"
// 未知の値は表示しない (スキップ) — UI 表示の頑健性を優先。
const FEATURE_LABELS: Record<string, string> = {
  string_change: "弦移動",
  in_slur: "スラー中",
  after_rest: "休符明け",
  high_pitch: "高音域",
}

function formatFeatures(features: string[] | undefined): string | null {
  if (!features || features.length === 0) return null
  const labels = features
    .map(f => FEATURE_LABELS[f])
    .filter((l): l is string => Boolean(l))
  if (labels.length === 0) return null
  return labels.join("、")
}

function feedbackBadge(feedback: LocalFeedback): { mark: string; label: string; cls: string } {
  if (feedback.type === "user_selected") {
    return {
      mark: "✓",
      label: `選択: ${candidateName(feedback.subTaskId)}`,
      cls: styles.badgeSelected,
    }
  }
  if (feedback.type === "user_rejected") {
    return { mark: "×", label: "違うと回答", cls: styles.badgeRejected }
  }
  return { mark: "?", label: "分からないと回答", cls: styles.badgeUncertain }
}

export default function ProblematicPositionList({
  performanceId,
  kind = "practice",
  positions,
  onJumpToPosition,
}: Props) {
  // v1.6 Phase 4-4: Score 演奏は /api/performances/[id]/feedback (Phase 4-3 で実装)
  const feedbackUrl =
    kind === "score"
      ? `/api/performances/${performanceId}/feedback`
      : `/api/practice-performances/${performanceId}/feedback`
  const [feedbackByPosition, setFeedbackByPosition] = useState<
    Record<string, LocalFeedback>
  >({})
  const [modalState, setModalState] = useState<{
    open: boolean
    positionId: string | null
    candidates: { id: string; name: string }[]
  }>({ open: false, positionId: null, candidates: [] })

  const submitFeedback = async (positionId: string, feedback: LocalFeedback) => {
    // 楽観的更新
    setFeedbackByPosition(prev => ({ ...prev, [positionId]: feedback }))
    // POST
    const body: Record<string, string> = {
      positionId,
      feedbackType: feedback.type,
    }
    if (feedback.type === "user_selected") {
      body.selectedSubTaskId = feedback.subTaskId
    }
    try {
      const res = await fetch(
        feedbackUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      if (!res.ok) {
        console.error(`[UI-4] feedback POST failed: HTTP ${res.status}`)
      }
    } catch (e) {
      console.error("[UI-4] feedback POST error", e)
    }
  }

  const handleClickConfirm = (position: ProblematicPosition) => {
    const candidates = position.candidate_sub_task_ids
    if (candidates.length === 0) return
    if (candidates.length === 1) {
      submitFeedback(position.position_id, {
        type: "user_selected",
        subTaskId: candidates[0],
      })
      return
    }
    // 候補 2 件以上 → モーダルを開く
    setModalState({
      open: true,
      positionId: position.position_id,
      candidates: candidates.map(id => ({ id, name: candidateName(id) })),
    })
  }

  const handleClickReject = (position: ProblematicPosition) => {
    submitFeedback(position.position_id, { type: "user_rejected" })
  }

  const handleClickUncertain = (position: ProblematicPosition) => {
    submitFeedback(position.position_id, { type: "user_uncertain" })
  }

  const handleModalConfirm = (selectedId: string) => {
    if (modalState.positionId) {
      submitFeedback(modalState.positionId, {
        type: "user_selected",
        subTaskId: selectedId,
      })
    }
    setModalState({ open: false, positionId: null, candidates: [] })
  }

  const handleModalClose = () => {
    setModalState({ open: false, positionId: null, candidates: [] })
  }

  if (positions.length === 0) {
    return (
      <div className={styles.emptyState} role="status">
        <div className={styles.emptyTitle}>気になる箇所はありません</div>
        <div className={styles.emptySub}>素晴らしい演奏でした！</div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.list}>
        {positions.map(position => {
          const feedback = feedbackByPosition[position.position_id] ?? null
          const badge = feedback ? feedbackBadge(feedback) : null
          const positionText = formatPosition(position)
          const candidateLabels = position.candidate_sub_task_ids
            .map(candidateName)
            .join("、")
          // UI-14: features を日本語ラベルに変換 (4 値固定)
          const featureHint = formatFeatures(position.features)

          return (
            <article
              key={position.position_id}
              className={styles.card}
              data-has-feedback={feedback ? "true" : undefined}
            >
              <button
                type="button"
                className={styles.positionButton}
                onClick={() => onJumpToPosition?.(position.note_indices)}
                aria-label={`${positionText} を譜面で表示`}
                disabled={!onJumpToPosition}
              >
                <span className={styles.positionText}>{positionText}</span>
                {onJumpToPosition && (
                  <span className={styles.jumpHint} aria-hidden="true">
                    🎯
                  </span>
                )}
              </button>

              {candidateLabels && (
                <div className={styles.candidates}>
                  <span className={styles.candidatesLabel}>候補:</span>{" "}
                  {candidateLabels}
                </div>
              )}

              {/* UI-14 (F8): features ヒント (控えめ表示) */}
              {featureHint && (
                <div className={styles.featureHint}>
                  <span className={styles.featureHintLabel}>ヒント:</span>{" "}
                  {featureHint}
                </div>
              )}

              <CandidateSelector
                currentFeedback={feedback}
                onClickConfirm={() => handleClickConfirm(position)}
                onClickReject={() => handleClickReject(position)}
                onClickUncertain={() => handleClickUncertain(position)}
              />

              {badge && (
                <div className={`${styles.badge} ${badge.cls}`}>
                  <span className={styles.badgeMark} aria-hidden="true">
                    {badge.mark}
                  </span>
                  {badge.label}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <CandidatePickerModal
        open={modalState.open}
        candidates={modalState.candidates}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
    </>
  )
}
