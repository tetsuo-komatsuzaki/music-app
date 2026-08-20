"use client"

// 解析通知 (採点中チップ / 完了バナー) — モック build-parts.py notice() の写経 (2026-08-20)。
//   採点中: 赤ランプ + 曲名/採点しているよ + 金のVUメーター
//   完了:   金チェック丸 + できたよ！/曲名 + 金ピル 結果を見る →
// 挙動 (既読の保存・15秒ポーリング) は従来のまま。
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ds from "./ds.module.css"

export type AnalysisNotice = {
  id: string
  scoreId: string
  title: string
  status: string          // "queued" | "processing" | "done" (供給側は生の文字列)
  score?: number | null
}

const SEEN_KEY = "arcoda.analysisNotice.seen"
const loadSeen = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") } catch { return [] }
}
const markSeen = (id: string) => {
  try {
    const s = loadSeen()
    if (!s.includes(id)) localStorage.setItem(SEEN_KEY, JSON.stringify([...s, id].slice(-30)))
  } catch { /* ストレージ不可なら諦める */ }
}

const VU = [40, 72, 55, 92, 63, 80, 46, 70]

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" />
    </svg>
  )
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
    <>
      <style>{`
        @keyframes anbBlink { 0%,100%{ opacity:1 } 50%{ opacity:.15 } }
        @keyframes anbVu { 0%,100%{ transform:scaleY(.35) } 30%{ transform:scaleY(1) } 60%{ transform:scaleY(.6) } }
      `}</style>

      {/* 完了: モック notice("done") */}
      {done.map((n) => (
        <Link
          key={n.id}
          href={`/${userId}/scores/${n.scoreId}?tab=review`}
          onClick={() => { markSeen(n.id); setSeen((s) => [...(s ?? []), n.id]) }}
          className={`${ds.card} pressable`}
          style={{ padding: "12px 14px", display: "block", textDecoration: "none", color: "inherit" }}
        >
          <div className={ds.row}>
            <span className={`${ds.chk} ${ds.gold}`} style={{ color: "var(--gold)" }}><Check /></span>
            <div className={ds.rowMain}>
              <b style={{ fontSize: 13.5 }}>できたよ！</b>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)" }}>{n.title}</span>
            </div>
            <span className={`${ds.pill} ${ds.gold}`}>結果を見る →</span>
          </div>
        </Link>
      ))}

      {/* 採点中: モック notice("run") */}
      {pending.length > 0 && (
        <div className={ds.card} style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 9, height: 9, borderRadius: "50%", background: "#e8697a", flex: "none",
                boxShadow: "0 0 10px rgba(232,105,122,.9)", animation: "anbBlink 1.1s steps(1) infinite",
              }}
            />
            <div className={ds.rowMain}>
              <b style={{ fontSize: 13.5 }}>
                {pending[0].title}{pending.length > 1 ? ` ほか${pending.length - 1}件` : ""}
              </b>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)" }}>採点しているよ</span>
            </div>
            <div style={{ height: 26, width: 54, padding: "4px 5px 0", flex: "none" }} aria-hidden>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 22 }}>
                {VU.map((h, i) => (
                  <i
                    key={i}
                    style={{
                      flex: 1, background: "var(--gold)", borderRadius: 1, height: `${h}%`,
                      transformOrigin: "bottom", animation: `anbVu 1s ease-in-out ${i * 0.13}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
