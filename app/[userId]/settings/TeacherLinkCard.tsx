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
    <section style={{ background: "var(--card-in)", border: "1px solid rgba(150,175,225,.12)", borderRadius: 14, padding: "16px 18px", margin: "0 0 16px" }}>
      <h2 style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)", margin: "0 0 4px" }}>先生とつながる</h2>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 12px" }}>
        先生からもらった招待コードを入力すると、先生とつながって宿題を受け取れます。
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="コード"
          maxLength={12}
          style={{ flex: 1, border: "1px solid rgba(150,175,225,.16)", borderRadius: 8, padding: "9px 12px", fontSize: "var(--fs-subhead)", letterSpacing: ".1em", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }}
        />
        <button
          type="button"
          onClick={connect}
          disabled={pending || code.trim().length < 4}
          style={{ border: "none", borderRadius: 8, padding: "0 18px", fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "var(--text-ink)", cursor: "pointer", opacity: pending || code.trim().length < 4 ? 0.5 : 1 }}
        >
          {pending ? "…" : "つながる"}
        </button>
      </div>
      {msg && (
        <div style={{ fontSize: "var(--fs-body)", marginTop: 10, color: msg.ok ? "#a8c97f" : "#e8697a" }}>{msg.text}</div>
      )}
    </section>
  )
}
