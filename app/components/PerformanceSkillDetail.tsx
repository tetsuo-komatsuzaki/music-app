// app/components/PerformanceSkillDetail.tsx
//
// C-6b (2026-07-11) — 演奏詳細のシェル (状態管理 + 削除メニュー + 217診断表示)。
// 旧55体系の skill-detail API 依存を廃止し、/diagnosis API 一本に統合。
//   - 解析中は 3 秒ポーリング (旧来の AutoRefresh パターン踏襲)
//   - done になったら弱点診断 (verdict + スロット + 推薦教材) を表示
// 旧 ImprovementGuideCard / GradeUpModal / 気になる箇所ジャンプは退役
// (課題化=217診断、グレード=★達成ベース。旧実装は git 7520842 以前を参照)。

"use client"

import { useEffect, useState } from "react"
import PerformanceMenu from "./PerformanceMenu"
import {
  type DiagnosisApiResponse,
} from "./WeaknessDiagnosisCard"
import styles from "./PerformanceSkillDetail.module.css"

type Props = {
  performanceId: string
  /** "practice" = 練習教材演奏 / "score" = 曲(Score)演奏。API base を切り替える。 */
  kind?: "practice" | "score"
  /** 削除成功時 (または 404 で既削除を検知した時) に親へ通知する。
   *  渡されない場合は ⋯ メニューを表示しない。 */
  onDeleted?: (performanceId: string) => void
  /** 「練習する →」リンクのルーティング用 userId (Supabase ユーザー ID)。 */
  userId?: string
}

type FetchState = {
  data: DiagnosisApiResponse | null
  error: string | null
  loaded: boolean
}

const INITIAL: FetchState = { data: null, error: null, loaded: false }

export default function PerformanceSkillDetail({
  performanceId,
  kind = "practice",
  onDeleted,
}: Props) {
  const url =
    kind === "score"
      ? `/api/performances/${performanceId}/diagnosis`
      : `/api/practice-performances/${performanceId}/diagnosis`
  const [state, setState] = useState<FetchState>(INITIAL)

  useEffect(() => {
    let aborted = false

    const fetchOnce = () =>
      fetch(url)
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return (await res.json()) as DiagnosisApiResponse
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
    // 解析中の演奏は 3 秒ごとに再取得
    const pollTimer = setInterval(fetchOnce, 3000)

    return () => {
      aborted = true
      clearInterval(pollTimer)
    }
  }, [url])

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

  if (error && !data) {
    return (
      <div className={styles.container}>
        {menuArea}
        <div className={`${styles.statusBox} ${styles.statusBoxError}`}>
          いまは見つけられなかったよ
        </div>
      </div>
    )
  }

  if (!data) return null

  // 解析中 / 解析エラー (analysisStatus !== "done")
  if (data.analysisStatus && data.analysisStatus !== "done") {
    const statusLabel: Record<string, string> = {
      queued: "順番待ちです",
      processing: "採点中です…",
      retrying: "採点をやり直し中です…",
      error: "採点中にエラーが発生しました。もう一度録音をお試しください。",
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
          {statusLabel[data.analysisStatus] ?? "採点の順番待ち…"}
        </div>
      </div>
    )
  }

  // 診断本体(今回の学びポイントと練習メニュー)は演奏履歴では非表示に (2026-08-01 Tetsuo指示)。
  // 削除メニュー(⋯)は残す。弱点/推薦は先生カルテ「練習」タブ側で扱う。
  return (
    <div className={styles.container}>
      {menuArea}
    </div>
  )
}
