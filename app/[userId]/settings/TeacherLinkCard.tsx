"use client"

// 設定 > 先生とつながる (2026-07-28)。招待コードを入力して先生と紐付ける。
// 自己完結(インラインstyle)なので SettingsClient に1行差し込むだけで動く。
import { useState, useTransition } from "react"
import { linkWithInviteCode } from "@/app/actions/teacherActions"

export default function TeacherLinkCard() {
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const connect = () => {
    setMsg(null)
    startTransition(async () => {
      const r = await linkWithInviteCode(code)
      if (r.ok) { setMsg({ ok: true, text: `${r.teacherName} 先生とつながりました` }); setCode("") }
      else setMsg({ ok: false, text: r.error })
    })
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "16px 18px", margin: "0 0 16px" }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: "#2b3742", margin: "0 0 4px" }}>先生とつながる</h2>
      <p style={{ fontSize: 12.5, color: "#6b7885", margin: "0 0 12px" }}>
        先生からもらった招待コードを入力すると、先生とつながって宿題を受け取れます。
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="コード"
          maxLength={12}
          style={{ flex: 1, border: "1px solid #dfe3e8", borderRadius: 8, padding: "9px 12px", fontSize: 14, letterSpacing: ".1em", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}
        />
        <button
          type="button"
          onClick={connect}
          disabled={pending || code.trim().length < 4}
          style={{ border: "none", borderRadius: 8, padding: "0 18px", fontSize: 13, fontWeight: 800, color: "#fff", background: "#2b3742", cursor: "pointer", opacity: pending || code.trim().length < 4 ? 0.5 : 1 }}
        >
          {pending ? "…" : "つながる"}
        </button>
      </div>
      {msg && (
        <div style={{ fontSize: 12.5, marginTop: 10, color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>
      )}
    </section>
  )
}
