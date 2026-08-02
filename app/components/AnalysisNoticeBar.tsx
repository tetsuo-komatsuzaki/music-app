"use client"

// ホーム上部の解析通知 (2026-08-02)。
//  - 採点中の録音がある → 「🎻 採点中…」チップ (完了を拾うため15秒ごとに router.refresh)
//  - 直近24hに完了した録音 → 「✅ 採点できたよ！」バナー (結果リンク)。既読は localStorage。
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type AnalysisNotice = {
  id: string
  status: string // queued | processing | done | error
  scoreId: string
  title: string
  score: number | null // 演奏スコア(音程+リズム平均・表示用)。未算出はnull
}

const SEEN_KEY = "arcoda_seen_analysis_v1"

function loadSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") } catch { return [] }
}
function markSeen(id: string) {
  try {
    const s = [...new Set([...loadSeen(), id])].slice(-50)
    localStorage.setItem(SEEN_KEY, JSON.stringify(s))
  } catch { /* private mode等は諦める */ }
}

export default function AnalysisNoticeBar({ userId, notices }: { userId: string; notices: AnalysisNotice[] }) {
  const router = useRouter()
  const [seen, setSeen] = useState<string[] | null>(null) // null=未ロード(SSRとの不一致回避)
  useEffect(() => { setSeen(loadSeen()) }, [])

  const pending = notices.filter((n) => n.status === "queued" || n.status === "processing")

  // 採点中は15秒ごとにサーバー再取得して完了を拾う
  useEffect(() => {
    if (pending.length === 0) return
    const t = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(t)
  }, [pending.length, router])

  if (seen === null) return null
  const done = notices.filter((n) => n.status === "done" && !seen.includes(n.id)).slice(0, 2)
  if (pending.length === 0 && done.length === 0) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <style>{`@keyframes anbPulse { 0%,100%{opacity:.4} 50%{opacity:1} }`}</style>

      {/* 完了バナー */}
      {done.map((n) => (
        <Link
          key={n.id}
          href={`/${userId}/scores/${n.scoreId}?tab=review`}
          onClick={() => { markSeen(n.id); setSeen((s) => [...(s ?? []), n.id]) }}
          style={{
            display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
            background: "linear-gradient(120deg,#e9f5ee,#f2fbf5)", border: "1.5px solid #bfe3cd",
            borderRadius: 13, padding: "11px 14px",
          }}
        >
          <span style={{ fontSize: 20 }} aria-hidden>🎉</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#1e6b43" }}>
              採点できたよ！
            </span>
            <span style={{ display: "block", fontSize: 11.5, color: "#4a5766", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              「{n.title}」{n.score != null ? ` — ${Math.round(n.score)}点` : ""}
            </span>
          </span>
          <span style={{ flex: "none", fontSize: 12, fontWeight: 800, color: "#fff", background: "#2e8b57", borderRadius: 999, padding: "7px 13px" }}>
            結果を見る →
          </span>
        </Link>
      ))}

      {/* 採点中チップ */}
      {pending.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          background: "#f4f6fb", border: "1px solid #dfe5f0", borderRadius: 13, padding: "10px 14px",
        }}>
          <span style={{ fontSize: 17, display: "inline-block", animation: "anbPulse 1.4s ease-in-out infinite" }} aria-hidden>🎻</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5766" }}>
            採点中… 「{pending[0].title}」{pending.length > 1 ? ` ほか${pending.length - 1}件` : ""}
            <span style={{ color: "#9aa6b3", fontWeight: 600 }}>（だいたい1〜2分）</span>
          </span>
        </div>
      )}
    </div>
  )
}
