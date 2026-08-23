"use client"

// L1 動作確認ページ (図解アセット導入指示書 commit2 / 実装指示書v1.2 L1検証用)
// 8技法×2ビューのモーション確認 + 同一ページ複数配置のID衝突確認。
// 本番導線からはリンクしない開発用ページ。

import { useState } from "react"
import { BowingDemo, BOWING_TECHNIQUES } from "@/app/components/violin"

export default function ViolinDevPage() {
  const [id, setId] = useState("staccato")
  const tech = BOWING_TECHNIQUES.find((t) => t.id === id)
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 800 }}>運弓モーション確認 (L1)</h1>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>
        8技法 / 2ビュー。下段は同一ページ複数配置のID衝突確認用 (常にスピッカート)。
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
        {BOWING_TECHNIQUES.map((t) => (
          <button
            key={t.id}
            onClick={() => setId(t.id)}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: id === t.id ? "#463527" : "#fff",
              color: id === t.id ? "#fff" : "#463527",
              fontWeight: 700,
              fontSize: "var(--fs-body)",
              cursor: "pointer",
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, margin: "6px 0" }}>
        {tech?.name} — {tech?.desc}
      </div>
      {/* 2ビュー横並び (図解アセット仕様書v1.2 §10 の並びを簡易再現) */}
      <style>{`.l1demo{display:flex;gap:12px;align-items:center}.l1demo>div{flex:1;min-width:0}.l1demo svg{width:100%;height:auto;max-height:300px}.l1demo2 svg{width:60%;height:auto}`}</style>
      <div className="l1demo" style={{ background: "#fff", border: "1px solid #e6e6e6", borderRadius: 12, padding: 12 }}>
        <BowingDemo technique={id} playing view="violin" />
        <BowingDemo technique={id} playing view="side" />
      </div>
      <div
        style={{
          marginTop: 18,
          background: "#fff",
          border: "1px dashed #ccc",
          borderRadius: 12,
          padding: 12,
          opacity: 0.85,
        }}
      >
        <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginBottom: 6 }}>
          2つ目のインスタンス (ID衝突チェック・spiccato固定)
        </div>
        <div className="l1demo2">
          <BowingDemo technique="spiccato" playing view="side" />
        </div>
      </div>
    </div>
  )
}
