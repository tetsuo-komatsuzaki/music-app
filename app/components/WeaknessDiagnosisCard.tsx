// app/components/WeaknessDiagnosisCard.tsx
//
// 工程C-6a (2026-07-11) — 217診断の弱点＋推薦教材カード（中間型・Tetsuo選定）。
// 演奏直後(窓①)と累積(窓②)の両方で使う共通表示。旧 ImprovementGuideCard(55体系)の後継。
//
// 表示ルール（Tetsuo確定）:
//   - verdict=perfect     → 「完璧な演奏です！」と褒める（診断空+崩壊ゼロ+総ミス率10%以下）
//   - verdict=no_specific → 「特定の弱点は見つかりませんでした」（診断空だがミス散発）
//   - verdict=overall     → 「全体的に外れている」+ 総数 + ★と調に合う基礎練 (F21 案A・2026-09-05)
//   - 粗い束 (slot.coarse) → 見出しは「同じ弦で上の音へ進む移動」のような移動の種類・弦 (F21 案B)
//   - verdict=unavailable → 診断データなし（v65以前の演奏・対応表なしの曲）
//   - 弱点スロット: 見出し＋ミス率＋内訳一言、教材はタイトル＋★・調＋[練習する →]
//   - 在庫ゼロ → 「教材準備中です」

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PartyPopper } from "lucide-react"
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
  verdict: "perfect" | "no_specific" | "weakness" | "overall" | "unavailable"
  slots: WeaknessSlot[]
  totals?: { played: number; pitchMiss: number; rhythmMiss: number } | null
  overall?: { materials: WeaknessMaterial[] } | null
  /** C-6b: 旧skill-detail後継 (シェルの解析中表示・ポーリング判定用) */
  analysisStatus?: "processing" | "done" | "error" | "queued" | "retrying"
}

/** 診断結果の本文表示 (verdict + スロット)。データは呼び手が用意する版 */
export function DiagnosisBody({
  data,
  userId,
  hideHeading,
  hideMaterials,
  fromScoreId,
}: {
  data: DiagnosisApiResponse
  userId?: string
  /** 見出し「今回の学びポイントと練習メニュー」を出さない (呼び手が独自の見出しを付ける場合) */
  hideHeading?: boolean
  /** おすすめ教材の行を出さず診断文のみ (教材は「毎日の基礎練」に一本化・2026-07-25 案B) */
  hideMaterials?: boolean
  /** 曲詳細から来た場合の元Score ID (教材ページの「曲にもどる」用) */
  fromScoreId?: string | null
}) {
  if (data.verdict === "perfect") {
    return (
      <div className={styles.perfectBox}>
        <span className={styles.perfectEmoji}><PartyPopper size={20} /></span>
        完璧な演奏です！
      </div>
    )
  }
  if (data.verdict === "no_specific") {
    return (
      <div className={styles.statusBox}>
        とくに苦手はなさそう。バランスよく弾けているよ
      </div>
    )
  }
  if (data.verdict === "unavailable") {
    return null
  }
  if (data.verdict === "overall") {
    const t = data.totals
    const mats = data.overall?.materials ?? []
    return (
      <section>
        {!hideHeading && <h3 className={styles.heading}>{hideMaterials ? "のびしろポイント" : "のびしろポイントと練習メニュー"}</h3>}
        <div className={styles.slotList}>
          <div className={styles.slot}>
            <div className={styles.slotTitle}>全体的に外れている</div>
            {t && <div className={styles.breakdown}>音程 {t.played - t.pitchMiss}/{t.played} ・ 入り {t.played - t.rhythmMiss}/{t.played} が合っていた。1か所ではなく全体なので、まず調と★に合う基礎練から</div>}
            {hideMaterials ? null : <MaterialRows materials={mats} userId={userId} fromScoreId={fromScoreId} />}
          </div>
        </div>
      </section>
    )
  }
  return (
    <section>
      {!hideHeading && (
        <h3 className={styles.heading}>
          {hideMaterials ? "のびしろポイント" : "のびしろポイントと練習メニュー"}
        </h3>
      )}
      <WeaknessSlotList slots={data.slots} userId={userId} hideMaterials={hideMaterials} fromScoreId={fromScoreId} />
    </section>
  )
}

const TREE_LABELS: Record<"pitch" | "rhythm", string> = {
  pitch: "音程",
  rhythm: "リズム",
}

// モック GROWTH_CARD: バーの色は軸で決める (音程=桃 / リズム=青緑)。数値はクリーム
const TREE_BAR: Record<"pitch" | "rhythm", string> = {
  pitch: "#e89ba8",
  rhythm: "#7fc4c4",
}

// ─── スロット表示（fetch済みデータを渡す版。累積窓など親がデータを持つ場合用） ───

export function WeaknessSlotList({
  slots,
  userId,
  hideMaterials,
  fromScoreId,
}: {
  slots: WeaknessSlot[]
  userId?: string
  /** おすすめ教材の行を出さず診断文のみ (教材は「毎日の基礎練」に一本化・2026-07-25 案B) */
  hideMaterials?: boolean
  /** 曲詳細から来た場合の元Score ID。教材ページに「曲にもどる」導線を出す (2026-08-02) */
  fromScoreId?: string | null
}) {
  // 音程/リズムで束ね、軸内をミス率の高い順にランク表示 (案E)。
  const groups = (["pitch", "rhythm"] as const)
    .map((tree) => ({
      tree,
      items: slots.filter((s) => s.tree === tree).sort((a, b) => b.missRate - a.missRate),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className={styles.slotList}>
      {groups.map((g) => (
        <div key={g.tree} className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.treeBadge}>{TREE_LABELS[g.tree]}</span>
            <span className={styles.groupCount}>{g.items.length}件</span>
          </div>
          {g.items.map((slot) => {
            // 成功率で前向きに表示。バーの色は軸色 (モック GROWTH_CARD)
            const successPct = 100 - Math.round(slot.missRate * 100)
            return (
              <div key={slot.subtaskId} className={styles.slot}>
                <div className={styles.slotTitle}>{slot.subtaskName}</div>
                <div className={styles.miniRow}>
                  <span className={styles.miniLabel}>成功率</span>
                  <span className={styles.miniTrack}>
                    <span className={styles.miniFill} style={{ width: `${successPct}%`, background: TREE_BAR[g.tree] }} />
                  </span>
                  <span className={styles.miniPct}>{successPct}<small className={styles.miniPctUnit}>%</small></span>
                </div>
                {slot.breakdown && <div className={styles.breakdown}>{slot.breakdown}</div>}

                    {hideMaterials ? null : <MaterialRows materials={slot.materials} userId={userId} fromScoreId={fromScoreId} />}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** おすすめ教材の行。空なら「準備中」 */
function MaterialRows({ materials, userId, fromScoreId }: { materials: WeaknessMaterial[]; userId?: string; fromScoreId?: string | null }) {
  if (materials.length === 0) {
    return <div className={styles.noStock}>ぴったりの教材はいま準備中。まずは曲の中で、この部分だけゆっくり弾いてみよう</div>
  }
  return (
    <div className={styles.materials}>
      <div className={styles.materialsLabel}>おすすめ教材</div>
      {materials.map((m) => (
        <div key={m.id} className={styles.materialRow}>
          <div className={styles.materialInfo}>
            <span className={styles.materialTitle}>{m.title}</span>
            <span className={styles.materialMeta}>
              {m.star !== null ? `★${m.star}・` : ""}
              {formatKey(m.keyTonic, m.keyMode)}
            </span>
          </div>
          {userId ? (
            <Link href={`/${userId}/practice/${m.category}/${m.id}${fromScoreId ? `?from=${fromScoreId}` : ""}`} className={styles.practiceLink}>
              練習する →
            </Link>
          ) : (
            <span className={styles.practiceLinkDisabled}>{categoryLabel(m.category)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

type Props = {
  performanceId: string
  kind: "score" | "practice"
  userId?: string
  /** 見出しを出さない (呼び手が独自の見出しを付ける場合) */
  hideHeading?: boolean
  /** おすすめ教材の行を出さず診断文のみ */
  hideMaterials?: boolean
  fromScoreId?: string | null
}

export default function WeaknessDiagnosisCard({ performanceId, kind, userId, hideHeading, hideMaterials, fromScoreId }: Props) {
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
    return <div className={styles.statusBox}>いまは見つけられなかったよ</div>
  }
  if (!data) {
    return <div className={styles.statusBox}>アルコがのびしろを探している…</div>
  }
  return <DiagnosisBody data={data} userId={userId} hideHeading={hideHeading} hideMaterials={hideMaterials} fromScoreId={fromScoreId} />
}
