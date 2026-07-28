"use client"

// 招待コード発行カード (2026-07-28)。先生が生徒に渡すコードを取得/表示。
import { useState } from "react"
import { getOrCreateInviteCode } from "@/app/actions/teacherActions"

export default function InviteCodeCard() {
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const reveal = async () => {
    setLoading(true); setErr(null)
    const r = await getOrCreateInviteCode()
    setLoading(false)
    if (r.ok) setCode(r.code)
    else setErr(r.error)
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#2b3742", marginBottom: 4 }}>生徒を招待する</div>
      <p style={{ fontSize: 12, color: "#6b7885", margin: "0 0 12px" }}>
        このコードを生徒に伝えてください。生徒はアプリの「設定 &gt; 先生とつながる」でコードを入力すると、あなたと繋がります。
      </p>
      {code ? (
        <div
          style={{
            fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 26, fontWeight: 800,
            letterSpacing: ".18em", textAlign: "center", color: "#2b3742",
            background: "#f6f7f9", border: "1px dashed #cbd3db", borderRadius: 10, padding: "12px 0",
          }}
        >
          {code}
        </div>
      ) : (
        <button
          type="button"
          onClick={reveal}
          disabled={loading}
          style={{
            width: "100%", border: "none", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 800,
            color: "#fff", background: "#2b3742", cursor: "pointer", opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "発行中…" : "招待コードを表示"}
        </button>
      )}
      {err && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{err}</div>}
    </div>
  )
}
