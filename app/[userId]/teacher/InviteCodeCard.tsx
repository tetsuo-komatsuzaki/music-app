"use client"

// 招待コード発行カード — 確定モック 先02 INVITE の写経 (2026-08-22)。
// 発行前=金罫カードの行 (＋丸 ・ 生徒を招待する ・ 招待コードを表示 ・ →)。
// 発行後=中央寄せカード (bigN38 ls.14em ・ 説明 ・ コードをコピー金グラデ/共有する mute) +
// 注意書きカード (コードは発行するたびに新しくなる)。
import { useState } from "react"
import { getOrCreateInviteCode } from "@/app/actions/teacherActions"
import ds from "@/app/components/ds.module.css"

export default function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const reveal = async () => {
    setLoading(true); setErr(null)
    const r = await getOrCreateInviteCode()
    setLoading(false)
    if (r.ok) setCode(r.code)
    else setErr(r.error)
  }

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { /* コピー不可環境は選択コピーで */ }
  }

  const share = async () => {
    if (!code) return
    try {
      await navigator.share?.({ text: `Arcodaの招待コード: ${code}` })
    } catch { /* キャンセル等は無視 */ }
  }

  if (!code) {
    return (
      <button type="button" onClick={reveal} disabled={loading} className={`${ds.card} pressable`}
        style={{ display: "block", width: "100%", padding: "14px 15px", borderColor: "rgba(232,178,60,.3)", textAlign: "left", cursor: "pointer", fontFamily: "inherit", opacity: loading ? 0.6 : 1 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden style={{ width: 26, height: 26, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", background: "rgba(232,178,60,.14)", color: "var(--gold)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 13.5, color: "var(--text-ink)", display: "block" }}>生徒を招待する</b>
            <span style={{ display: "block", fontSize: 11, color: "var(--text-sub)" }}>{loading ? "発行中…" : "招待コードを表示"}</span>
          </span>
          <span aria-hidden style={{ color: "var(--text-sub)", fontWeight: 800 }}>→</span>
        </span>
        {err && <span style={{ display: "block", fontSize: "var(--fs-body)", color: "#e8a78f", marginTop: 8 }}>{err}</span>}
      </button>
    )
  }

  return (
    <>
      <div className={ds.card} style={{ textAlign: "center", padding: "24px 18px" }}>
        <div style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 800 }}>招待コード</div>
        <div className={ds.bigN} style={{ fontSize: 38, letterSpacing: ".14em", marginTop: 8 }}>{code}</div>
        <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 10, lineHeight: 1.8 }}>
          生徒がこのコードを入れると、<br />あなたとつながるよ。
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 9 }}>
          <button type="button" onClick={copy} className="pressable"
            style={{ flex: 1, border: "none", background: "linear-gradient(180deg,#e8b23c,#d2992c)", borderRadius: 14, padding: 12, color: "#201604", fontWeight: 900, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer" }}>
            {copied ? "コピーしたよ ✓" : "コードをコピー"}
          </button>
          <button type="button" onClick={share} className="pressable"
            style={{ width: 104, flex: "none", border: "none", borderRadius: 14, padding: 12, background: "rgba(150,175,225,.10)", color: "var(--text-ink)", fontWeight: 800, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            共有する
          </button>
        </div>
      </div>
      <div className={ds.card} style={{ padding: "13px 15px" }}>
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.8 }}>
          コードは発行するたびに新しくなるよ。<br />前のコードは使えなくなるよ。
        </div>
      </div>
    </>
  )
}
