"use client"

// ホーム上部の解析通知 (2026-08-02 案2改・Tetsuo確定デザイン: クリーム×木目)。
//  - 採点中: 赤ランプ+曲名チップ+金のVUメーター (完了を拾うため15秒ごとに router.refresh)
//  - 完了: 「できたよ！」スタンプ+曲名+結果ボタンの1行バナー。既読は localStorage。
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type AnalysisNotice = {
  id: string
  status: string // queued | processing | done | error
  scoreId: string
  title: string
  score: number | null // 現デザインでは未表示 (将来用に温存)
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

const CARD: React.CSSProperties = {
  background: "linear-gradient(150deg,#fdf8ec,#f7efe2)",
  border: "1.5px solid #e8dcc2",
  borderRadius: 13,
}
const VU_BARS = [11, 18, 14, 9, 15]

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
      <style>{`
        @keyframes anbBlink { 0%,100%{ opacity:1 } 50%{ opacity:.15 } }
        @keyframes anbVu { 0%,100%{ transform:scaleY(.3) } 30%{ transform:scaleY(1) } 60%{ transform:scaleY(.6) } }
        @keyframes anbStamp { 0%{ transform:scale(2.2) rotate(-6deg); opacity:0 } 60%{ transform:scale(.92) rotate(-6deg); opacity:1 } 100%{ transform:scale(1) rotate(-6deg) } }
      `}</style>

      {/* 完了バナー: [できたよ！] 曲名 [結果を見る →] の1行構成 */}
      {done.map((n) => (
        <Link
          key={n.id}
          href={`/${userId}/scores/${n.scoreId}?tab=review`}
          onClick={() => { markSeen(n.id); setSeen((s) => [...(s ?? []), n.id]) }}
          style={{ ...CARD, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", padding: "11px 14px" }}
        >
          <span style={{ flex: "none", fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#2e8b57", border: "2.5px solid #2e8b57", borderRadius: 7, padding: "3px 9px", display: "inline-block", animation: "anbStamp .5s ease-out" }}>
            できたよ！
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: "#4a3f2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            「{n.title}」
          </span>
          <span style={{ flex: "none", fontSize: 11.5, fontWeight: 800, color: "#fff", background: "#2e8b57", borderRadius: 999, padding: "7px 13px" }}>
            結果を見る →
          </span>
        </Link>
      ))}

      {/* 採点中チップ: 赤ランプ + 曲名 + VUメーター */}
      {pending.length > 0 && (
        <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 9, padding: "10px 14px" }}>
          <span aria-hidden style={{ flex: "none", width: 9, height: 9, borderRadius: "50%", background: "#d64541", animation: "anbBlink 1.1s steps(1) infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#4a3f2e", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            「{pending[0].title}」を採点ちゅう…{pending.length > 1 ? ` ほか${pending.length - 1}件` : ""}
            <span style={{ color: "#9a8c74", fontWeight: 600 }}>（約1〜2分）</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2.5, height: 14, marginLeft: "auto", flex: "none" }} aria-hidden>
            {VU_BARS.map((h, i) => (
              <span key={i} style={{ width: 3.5, height: h * 0.78, borderRadius: 2, transformOrigin: "bottom", background: "linear-gradient(180deg,#c9a227,#b8862e)", animation: `anbVu 1s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
