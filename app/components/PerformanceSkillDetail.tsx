// app/components/PerformanceSkillDetail.tsx
//
// UI 設計書 v3 §5 — 演奏完了画面の v3.2.2 拡張部分のコンテナ。
// PracticePerformance 由来の演奏に対して GET /api/practice-performances/[id]/skill-detail
// を呼び、4 状態 (loading / error / not-done / done) を集約管理する。
//
// 子コンポーネント (UI-3 〜 UI-7 で順次実装):
//   - SkillScoreCard         : 中項目スコア (UI-3 で実装、本 PR に含む)
//   - ProblematicPositionList: 気になる箇所 (UI-4)
//   - CandidateSelector      : 候補選択       (UI-4)
//   - ImprovementGuideCard   : 改善アドバイス (UI-5)
//   - 演奏削除メニュー        : (UI-6)
//   - GradeUpModal           : (UI-7)

"use client"

import { useEffect, useState } from "react"
import SkillScoreCard, { getNullReason } from "./SkillScoreCard"
import GradeUpModal from "./GradeUpModal"
import PerformanceMenu from "./PerformanceMenu"
import ImprovementGuideCard from "./ImprovementGuideCard"
import ProblematicPositionList from "./ProblematicPositionList"
import styles from "./PerformanceSkillDetail.module.css"

// ---------------------------------------------------------------------------
// 型 (skill-detail API レスポンス、v3.2.2 §15-2 準拠)
// ---------------------------------------------------------------------------

export type SubScoreData = {
  score: number
  matched: boolean
  sample_size: number
  target_count: number
  bad_count: number
  details: string | null
  details_with_count: string | null
}

export type ProblematicPosition = {
  position_id: string
  measure_start: number
  beat_start: number
  measure_end: number
  beat_end: number
  note_indices: number[]
  candidate_sub_task_ids: string[]
  severity: number
  features: string[]
}

export type ImprovementMethod = {
  type: "awareness" | "practice" | "etude_recommendation"
  title: string
  description: string
  durationMinutes?: number
  steps?: string[]
}

export type ImprovementGuideEntry = {
  subTaskId: string
  subTaskName: string
  parentTaskId: string
  parentTaskName: string
  /** UI-13 (F2): 該当 sub_task の active/improving カード ID。
   *  null の場合は「この教材で練習する（準備中）」disabled 表示。 */
  cardId: string | null
  guide: {
    awareness: ImprovementMethod
    practice: ImprovementMethod
    etudeRecommendation: ImprovementMethod
  }
}

export type GradeUpdate = {
  recentlyChanged: boolean
  previousGrade?: string
  newGrade?: string
}

export type SkillDetailResponse = {
  performanceId: string
  practiceItemId: string
  practiceItemTitle: string
  overallScore: number | null
  pitchAccuracy: number | null
  timingAccuracy: number | null
  pitchSkillScore: number | null
  rhythmSkillScore: number | null
  bowingSkillScore: number | null
  skillSubScores: Record<string, SubScoreData> | null
  problematicPositions: ProblematicPosition[] | null
  analysisStatus: "processing" | "done" | "error" | "queued" | "retrying"
  improvementGuides: ImprovementGuideEntry[]
  gradeUpdate: GradeUpdate | null
  musicxmlPath: string
  audioPath: string | null
  recordingBpm: number | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// メインコンポーネント
// ---------------------------------------------------------------------------

type Props = {
  performanceId: string
  /** v1.6 Phase 4-4: "practice" = 練習教材演奏 / "score" = 曲(Score)演奏。
   *  skill-detail / feedback の API base を切り替える。デフォルト "practice" (後方互換)。 */
  kind?: "practice" | "score"
  /** 削除成功時 (または 404 で既削除を検知した時) に親へ通知する。
   *  渡されない場合は ⋯ メニューを表示しない。 */
  onDeleted?: (performanceId: string) => void
  /** UI-4: 気になる箇所のカードタップ時に譜面ジャンプ + ハイライトを実行する。
   *  渡されない場合は位置ボタンが disabled になる。 */
  onJumpToPosition?: (noteIndices: number[]) => void
  /** UI-13: 「この教材で練習する」ボタンから練習画面に遷移するために必要な
   *  ルーティング用 userId (Supabase ユーザー ID = URL パラメータ)。
   *  渡されない場合は教材ボタンは disabled。 */
  userId?: string
}

type FetchState = {
  data: SkillDetailResponse | null
  error: string | null
  /** 初回取得完了したか (true 以降は state.data の有無で表示分岐) */
  loaded: boolean
}

const INITIAL: FetchState = { data: null, error: null, loaded: false }

export default function PerformanceSkillDetail({
  performanceId,
  kind = "practice",
  onDeleted,
  onJumpToPosition,
  userId,
}: Props) {
  // v1.6 Phase 4-4: Score 演奏は /api/performances/[id]/...、練習は practice-performances
  const skillDetailUrl =
    kind === "score"
      ? `/api/performances/${performanceId}/skill-detail`
      : `/api/practice-performances/${performanceId}/skill-detail`
  // performanceId 変更時に key として使われ、コンポーネント自体は再マウントされる前提。
  // (scoreDetail.tsx 側の history で別演奏を選んだ時、parent が key={selected.id} で
  //  この子を再マウントするか、または同じインスタンスで performanceId が変わる)
  const [state, setState] = useState<FetchState>(INITIAL)

  useEffect(() => {
    let aborted = false

    const fetchOnce = () =>
      fetch(skillDetailUrl)
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return (await res.json()) as SkillDetailResponse
        })
        .then(json => {
          if (aborted) return
          setState({ data: json, error: null, loaded: true })
        })
        .catch(e => {
          if (aborted) return
          setState(prev => ({
            data: prev.data,
            error: e instanceof Error ? e.message : String(e),
            loaded: true,
          }))
        })

    fetchOnce()
    // 解析中の演奏は 3 秒ごとに再取得 (UI 設計書 §5-9 + 既存 AutoRefresh パターン)
    const pollTimer = setInterval(fetchOnce, 3000)

    return () => {
      aborted = true
      clearInterval(pollTimer)
    }
  }, [skillDetailUrl])

  const { data, error, loaded } = state
  const loading = !loaded

  const menuArea = onDeleted ? (
    <div className={styles.menuArea}>
      <PerformanceMenu
        performanceId={performanceId}
        onDeleted={onDeleted}
        kind={kind}
      />
    </div>
  ) : null

  // --- 状態1: loading ---
  if (loading && !data) {
    return (
      <div className={styles.container}>
        {menuArea}
        <div className={styles.statusBox}>
          <span className={styles.spinner} />
          読み込み中…
        </div>
      </div>
    )
  }

  // --- 状態2: error ---
  if (error && !data) {
    return (
      <div className={styles.container}>
        {menuArea}
        <div className={`${styles.statusBox} ${styles.statusBoxError}`}>
          スキル詳細の取得に失敗しました ({error})
        </div>
      </div>
    )
  }

  if (!data) return null

  // --- 状態3: 解析中 / 解析エラー (analysisStatus !== "done") ---
  if (data.analysisStatus !== "done") {
    const statusLabel: Record<string, string> = {
      queued: "順番待ちです",
      processing: "解析中です…",
      retrying: "解析を再試行中です…",
      error: "解析中にエラーが発生しました。もう一度録音をお試しください。",
    }
    return (
      <div className={styles.container}>
        {menuArea}
        <div
          className={
            data.analysisStatus === "error"
              ? `${styles.statusBox} ${styles.statusBoxError}`
              : styles.statusBox
          }
        >
          {data.analysisStatus !== "error" && <span className={styles.spinner} />}
          {statusLabel[data.analysisStatus] ?? "解析待機中"}
        </div>
      </div>
    )
  }

  // --- 状態4: done — 各サブコンポーネントを表示 ---
  const scores = {
    pitch: data.pitchSkillScore,
    rhythm: data.rhythmSkillScore,
    bowing: data.bowingSkillScore,
  }
  const nullReason = getNullReason(scores)

  return (
    <div className={styles.container}>
      {menuArea}

      {/* UI-3: 中項目スコアカード (本 PR で実装) */}
      <section className={styles.section}>
        <SkillScoreCard scores={scores} nullReason={nullReason} />
      </section>

      {/* UI-4: 気になる箇所リスト + 候補選択 */}
      <section className={styles.section}>
        <ProblematicPositionList
          performanceId={data.performanceId}
          kind={kind}
          positions={data.problematicPositions ?? []}
          onJumpToPosition={onJumpToPosition}
        />
      </section>

      {/* UI-5 + UI-13: 改善アドバイス + 教材ボタン */}
      <section className={styles.section}>
        <ImprovementGuideCard guides={data.improvementGuides} userId={userId} />
      </section>

      {/* UI-7: グレードアップ通知モーダル (recentlyChanged + 未通知の場合のみ表示) */}
      {data.gradeUpdate?.recentlyChanged && (
        <GradeUpModal
          performanceId={data.performanceId}
          previousGrade={data.gradeUpdate.previousGrade}
          newGrade={data.gradeUpdate.newGrade}
        />
      )}
    </div>
  )
}
