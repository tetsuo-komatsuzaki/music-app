"use client"

// プラン欄 (課金 Phase 2, 2026-08-07 課金設計: project_pricing_plan)
// - 無料: アルコプラスの案内 + 月額/年額の加入ボタン (Stripe Checkout へ)
// - 加入中: 状態表示 + 「契約を管理」(Stripe Customer Portal へ)
// - Stripe 未構成 (env なし) の間はサーバー側で billingEnabled=false → 何も描画しない
import { useState } from "react"
import { Sparkles } from "lucide-react"

type Props = {
  billingEnabled: boolean
  /** 実効プラン (猶予・先生特典は含まない、純粋な契約状態) */
  isPlus: boolean
  planStatus: string | null
  /** ISO 文字列 (Server Component から渡すため Date にしない) */
  periodEnd: string | null
  trialEligible: boolean
}

const STATUS_LABEL: Record<string, string> = {
  trialing: "無料トライアル中",
  active: "契約中",
  past_due: "お支払いに問題があります",
}

export default function PlanCard({ billingEnabled, isPlus, planStatus, periodEnd, trialEligible }: Props) {
  const [pending, setPending] = useState<"month" | "year" | "portal" | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!billingEnabled) return null

  const jump = async (kind: "month" | "year" | "portal") => {
    setPending(kind)
    setError(null)
    try {
      const res = await fetch(kind === "portal" ? "/api/stripe/portal" : "/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: kind === "portal" ? undefined : JSON.stringify({ interval: kind }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
        return // 遷移するので pending は解除しない
      }
      setError(data.error ?? "エラーが発生しました。時間をおいて試してください")
    } catch {
      setError("通信に失敗しました。時間をおいて試してください")
    }
    setPending(null)
  }

  const endDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null

  return (
    <section style={{ background: "#fff", border: "1px solid #eceff3", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
      <h2 style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, margin: "0 0 4px", color: "var(--text-ink)" }}>プラン</h2>

      {isPlus ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 4px" }}>
            <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-master)", display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkles size={15} /> アルコプラス</span>
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-master)", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 999, padding: "2px 10px" }}>
              {(planStatus && STATUS_LABEL[planStatus]) || "契約中"}
            </span>
          </div>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 10px", lineHeight: 1.6 }}>
            アルコの採点は無制限で使えます。
            {planStatus === "trialing" && endDate && <>無料期間は {endDate} までです。</>}
            {planStatus === "active" && endDate && <>次回の更新日は {endDate} です。</>}
            {planStatus === "past_due" && <>カード情報をご確認ください (このままだと無料プランに戻ります)。</>}
          </p>
          <button
            type="button"
            onClick={() => jump("portal")}
            disabled={pending != null}
            style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-body)", background: "#fff", border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 18px", cursor: "pointer", opacity: pending ? 0.5 : 1 }}
          >
            {pending === "portal" ? "開いています…" : "契約を管理"}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 10px", lineHeight: 1.7 }}>
            <b style={{ color: "var(--text-ink)" }}><Sparkles size={13} style={{ verticalAlign: -1 }} /> アルコプラス</b> — アルコの採点が無制限になり、全ての基礎練・学びレッスン・
            おすすめ練習・部分練習・くわしい数字が使えるようになります。
            {trialEligible && <><br /><b style={{ color: "var(--text-master)" }}>はじめての方は14日間無料</b>で試せます。</>}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => jump("month")}
              disabled={pending != null}
              style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#8a5a1f", border: "none", borderRadius: 9, padding: "10px 20px", cursor: "pointer", opacity: pending ? 0.5 : 1 }}
            >
              {pending === "month" ? "開いています…" : "月額 980円で始める"}
            </button>
            <button
              type="button"
              onClick={() => jump("year")}
              disabled={pending != null}
              style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-master)", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 9, padding: "10px 20px", cursor: "pointer", opacity: pending ? 0.5 : 1 }}
            >
              {pending === "year" ? "開いています…" : "年額 9,800円・2ヶ月分お得"}
            </button>
          </div>
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: "8px 0 0" }}>
            価格は税込です。いつでも解約できます。
          </p>
        </>
      )}

      {error && <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-error)", margin: "8px 0 0" }}>{error}</p>}
    </section>
  )
}
