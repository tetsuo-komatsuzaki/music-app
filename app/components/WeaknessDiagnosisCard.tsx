// app/components/WeaknessDiagnosisCard.tsx
//
// 工程C-6a (2026-07-11) — 217診断の弱点＋推薦教材カード（中間型・Tetsuo選定）。
// 演奏直後(窓①)と累積(窓②)の両方で使う共通表示。旧 ImprovementGuideCard(55体系)の後継。
//
// 表示ルール（Tetsuo確定）:
//   - verdict=perfect     → 「完璧な演奏です！」と褒める（診断空+崩壊ゼロ+総ミス率10%以下）
//   - verdict=no_specific → 「特定の弱点は見つかりませんでした」（診断空だがミス散発）
//   - verdict=unavailable → 診断データなし（v65以前の演奏・対応表なしの曲）
//   - 弱点スロット: 見出し＋ミス率＋内訳一言、教材はタイトル＋★・調＋[練習する →]
//   - 在庫ゼロ → 「教材準備中です」

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "./WeaknessDiagnosisCard.module.css"
import { formatKey } from "@/app/_libs/musicNotation"
import { categoryLabel } from "@/app/_libs/practiceConstants"

// ─── 型 (diagnosis API レスポンスと同期: app/_libs/diagnosisPresentation.ts) ───

export type WeaknessMaterial = {
  id: string
  title: string
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
}

export type WeaknessSlot = {
  subtaskId: string
  subtaskName: string
  tree: "pitch" | "rhythm"
  miss: number
  target: number
  missRate: number
  breakdown: string | null
  materials: WeaknessMaterial[]
  noStock: boolean
}

export type DiagnosisApiResponse = {
  verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
  slots: WeaknessSlot[]
  /** C-6b: 旧skill-detail後継 (シェルの解析中表示・ポーリング判定用) */
  analysisStatus?: "processing" | "done" | "error" | "queued" | "retrying"
}

/** 診断結果の本文表示 (verdict + スロット)。データは呼び手が用意する版 */
export function DiagnosisBody({
  data,
  userId,
}: {
  data: DiagnosisApiResponse
  userId?: string
}) {
  if (data.verdict === "perfect") {
    return (
      <div className={styles.perfectBox}>
        <span className={styles.perfectEmoji}>🎉</span>
        完璧な演奏です！
      </div>
    )
  }
  if (data.verdict === "no_specific") {
    return (
      <div className={styles.statusBox}>
        特定の弱点は見つかりませんでした（ミスは散発的です）
      </div>
    )
  }
  if (data.verdict === "unavailable") {
    return (
      <div className={styles.statusBox}>
        この演奏には弱点診断がありません（新しい演奏から表示されます）
      </div>
    )
  }
  return (
    <section>
      <h3 className={styles.heading}>今回の弱点と練習メニュー</h3>
      <WeaknessSlotList slots={data.slots} userId={userId} />
    </section>
  )
}

const TREE_LABELS: Record<"pitch" | "rhythm", string> = {
  pitch: "音程",
  rhythm: "リズム",
}

// ─── スロット表示（fetch済みデータを渡す版。累積窓など親がデータを持つ場合用） ───

export function WeaknessSlotList({
  slots,
  userId,
}: {
  slots: WeaknessSlot[]
  userId?: string
}) {
  return (
    <div className={styles.slotList}>
      {slots.map((slot) => (
        <div key={slot.subtaskId} className={styles.slot}>
          <div className={styles.slotHeader}>
            <span className={styles.treeBadge}>{TREE_LABELS[slot.tree]}</span>
            <span className={styles.slotTitle}>🎯 {slot.subtaskName}</span>
            <span className={styles.slotStats}>
              {slot.target}音中{slot.miss}ミス（{Math.round(slot.missRate * 100)}%）
            </span>
          </div>
          {slot.breakdown && <div className={styles.breakdown}>{slot.breakdown}</div>}

          {slot.noStock ? (
            <div className={styles.noStock}>教材準備中です</div>
          ) : (
            <div className={styles.materials}>
              <div className={styles.materialsLabel}>おすすめ教材</div>
              {slot.materials.map((m) => (
                <div key={m.id} className={styles.materialRow}>
                  <div className={styles.materialInfo}>
                    <span className={styles.materialTitle}>{m.title}</span>
                    <span className={styles.materialMeta}>
                      {m.star !== null ? `★${m.star}・` : ""}
                      {formatKey(m.keyTonic, m.keyMode)}
                    </span>
                  </div>
                  {userId ? (
                    <Link
                      href={`/${userId}/practice/${m.category}/${m.id}`}
                      className={styles.practiceLink}
                    >
                      練習する →
                    </Link>
                  ) : (
                    <span className={styles.practiceLinkDisabled}>
                      {categoryLabel(m.category)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── 累積弱点パネル（ホーム用・窓②）: /api/users/[userId]/weakness を fetch ───

export function CumulativeWeaknessPanel({
  userId,
  emptyFallback,
}: {
  /** URL パラメータの userId (Supabase ID)。API 認可と「練習する →」リンクに使用 */
  userId: string
  /** 累積弱点が無い(データ不足含む)ときに出す代替表示（例: 次の曲にチャレンジ） */
  emptyFallback: React.ReactNode
}) {
  const [slots, setSlots] = useState<WeaknessSlot[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let aborted = false
    fetch(`/api/users/${userId}/weakness`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as { slots: WeaknessSlot[] }
      })
      .then((json) => {
        if (!aborted) setSlots(json.slots)
      })
      .catch(() => {
        if (!aborted) setError(true)
      })
    return () => {
      aborted = true
    }
  }, [userId])

  if (error || (slots !== null && slots.length === 0)) {
    return <>{emptyFallback}</>
  }
  if (slots === null) {
    return <div className={styles.statusBox}>弱点を分析中…</div>
  }
  return (
    <>
      <div className={styles.cumulativeIntro}>
        これまでの演奏から、いまの弱点はこれ！
        <br />
        クリアに向けて弱点練習をしてみよう！
      </div>
      <WeaknessSlotList slots={slots} userId={userId} />
    </>
  )
}

// ─── 演奏直後カード（自分で diagnosis API を fetch する版・窓①） ───

type Props = {
  performanceId: string
  /** "score" = 曲(Performance) / "practice" = 基礎練(PracticePerformance) */
  kind: "score" | "practice"
  /** 「練習する →」の遷移に使う URL 用 userId (Supabase ID)。無ければリンク非表示 */
  userId?: string
}

export default function WeaknessDiagnosisCard({ performanceId, kind, userId }: Props) {
  const url =
    kind === "score"
      ? `/api/performances/${performanceId}/diagnosis`
      : `/api/practice-performances/${performanceId}/diagnosis`
  const [data, setData] = useState<DiagnosisApiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as DiagnosisApiResponse
      })
      .then((json) => {
        if (!aborted) setData(json)
      })
      .catch((e) => {
        if (!aborted) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      aborted = true
    }
  }, [url])

  if (error) {
    return <div className={styles.statusBox}>弱点診断の取得に失敗しました（{error}）</div>
  }
  if (!data) {
    return <div className={styles.statusBox}>弱点を分析中…</div>
  }
  return <DiagnosisBody data={data} userId={userId} />
}
