"use client"

// プラン欄 (2026-09-12 要件整理 v2.7 §3 U-9・C-20)。
// - Apple (iOS): 状態表示 (無料期間中・契約中・更新しない予定・お支払いに問題・契約切れ・運営) と「契約を管理」(Apple の管理シート)。
//   未加入・契約切れは「アルコプラスをはじめる」→ /start。価格はここに書かない (StoreKit の値だけを /start で出す)。
// - Web で Apple の契約者: 状態表示と account.apple.com へのリンク (Strava 型)。
// - Stripe (従来・眠らせ中): Web の既存契約者にだけ「契約を管理」(Customer Portal)。新規の加入ボタンは出さない。
import { useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { isAppleBilling } from "@/app/_libs/billingMode"
import { useIsNativeApp, useCanShowBillingEntryPoint } from "@/app/_hooks/useIsNativeApp"
import { showManageSubscriptions } from "@/app/_libs/appleStore"

export type PlanCardProps = {
  billingEnabled: boolean
  /** 実効プラン (猶予・先生特典は含まない、純粋な契約状態) */
  isPlus: boolean
  planStatus: string | null
  /** ISO 文字列 (Server Component から渡すため Date にしない) */
  periodEnd: string | null
  /** "apple" | "stripe" | null */
  provider?: string | null
  /** 開発者アカウント ("internal") */
  planGrant?: string | null
  /** Apple の自動更新の予定。false = 更新しない予定 */
  autoRenew?: boolean | null
}

const APPLE_MANAGE_URL = "https://account.apple.com/account/manage/section/subscriptions"

type View = { chip: string; chipTone: "master" | "warn" | "muted"; text: string; action: "manage" | "start" | "none" }

function viewOf(p: PlanCardProps, endDate: string | null): View {
  if (p.planGrant === "internal") return { chip: "運営", chipTone: "master", text: "運営用のアカウントです。採点は無制限で使えます。", action: "none" }
  const st = p.planStatus
  if (p.isPlus && st === "trialing") return { chip: "無料期間中", chipTone: "master", text: `無料期間中は 1 日 8 本・10 分まで採点できます。${endDate ? `無料期間は ${endDate} までです。` : ""}`, action: "manage" }
  if (p.isPlus && st === "past_due") return { chip: "お支払いに問題があります", chipTone: "warn", text: "カード情報をご確認ください。このままだと採点が使えなくなります。", action: "manage" }
  if (p.isPlus && p.autoRenew === false) return { chip: "更新しない予定", chipTone: "muted", text: `${endDate ? `${endDate} まで使えます。` : ""}そのあと採点は止まります。続けるには契約を管理から。`, action: "manage" }
  if (p.isPlus) return { chip: "契約中", chipTone: "master", text: `アルコの採点は無制限で使えます。${endDate ? `次回の更新日は ${endDate} です。` : ""}`, action: "manage" }
  if (st === "expired" || st === "canceled") return { chip: "契約切れ", chipTone: "muted", text: "採点と基礎練が止まっています。記録は残っています。", action: "start" }
  return { chip: "未加入", chipTone: "muted", text: "アルコの採点が無制限になり、自分の楽譜を取り込んで、その曲も採点できるようになります。", action: "start" }
}

export default function PlanCard(props: PlanCardProps) {
  const { billingEnabled, planStatus, periodEnd, provider } = props
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const apple = isAppleBilling()
  const native = useIsNativeApp()
  const canShow = useCanShowBillingEntryPoint()

  // Stripe が未構成で、Apple でもないなら欄ごと出さない (従来どおり)
  if (!billingEnabled && !apple) return null

  const endDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null
  const v = viewOf(props, endDate)
  const chipStyle = {
    master: { color: "var(--text-master)", background: "rgba(232,178,60,.12)", border: "1px solid rgba(232,178,60,.3)" },
    warn: { color: "var(--text-error)", background: "rgba(255,123,110,.1)", border: "1px solid rgba(255,123,110,.4)" },
    muted: { color: "var(--text-sub)", background: "transparent", border: "1px solid rgba(150,175,225,.3)" },
  }[v.chipTone]

  // 「契約を管理」: Apple の契約者 → iOS は管理シート・Web は account.apple.com。Stripe の契約者 → Customer Portal
  const manage = async () => {
    setError(null)
    if (provider === "apple" || (apple && provider !== "stripe")) {
      if (native) {
        const ok = await showManageSubscriptions()
        if (!ok) window.open(APPLE_MANAGE_URL, "_blank")
      } else {
        window.open(APPLE_MANAGE_URL, "_blank")
      }
      return
    }
    setPending(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.url) { window.location.href = data.url; return }
      setError(data.error ?? "エラーが発生しました。時間をおいて試してください")
    } catch {
      setError("通信に失敗しました。時間をおいて試してください")
    }
    setPending(false)
  }

  const btn = { fontSize: "var(--fs-body)", fontWeight: 800, borderRadius: 9, padding: "9px 18px", cursor: "pointer" } as const

  return (
    <section style={{ background: "var(--card-in)", border: "1px solid rgba(150,175,225,.12)", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
      <h2 style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, margin: "0 0 4px", color: "var(--text-ink)" }}>プラン</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 4px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: v.action === "start" && v.chip === "契約切れ" ? "var(--text-sub)" : "var(--text-master)", display: "inline-flex", alignItems: "center", gap: 4 }}><Sparkles size={15} /> アルコプラス</span>
        <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, borderRadius: 999, padding: "2px 10px", ...chipStyle }}>{v.chip}</span>
      </div>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 10px", lineHeight: 1.6 }}>{v.text}</p>

      {v.action === "manage" && (
        <>
          <button type="button" onClick={() => void manage()} disabled={pending}
            style={{ ...btn, color: "var(--text-body)", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.16)", opacity: pending ? 0.5 : 1 }}>
            {pending ? "開いています…" : "契約を管理"}
          </button>
          {!native && (provider === "apple" || apple) && (
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: "8px 0 0" }}>変更・解約は Apple のアカウントページで行います。iPhone の設定 › サブスクリプションからもできます。</p>
          )}
        </>
      )}
      {v.action === "start" && (
        !apple ? (
          /* stripe モード (アプリ公開前の本番): Stripe の新規導線は止める決定 (2026-09-12)。存在しないアプリへ送らず「準備中」(CR-1-04) */
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: 0 }}>アルコプラスの新しいお申し込みは準備中です。はじまったらお知らせします。</p>
        ) : canShow ? (
          <>
            <Link href="/start" style={{ ...btn, display: "inline-block", color: "#fff", background: "#b8862e", border: "none", textDecoration: "none" }}>
              {v.chip === "契約切れ" ? "再開する" : "アルコプラスをはじめる"}
            </Link>
            {v.chip !== "契約切れ" && (
              <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: "8px 0 0" }}>最初の 2 週間は無料、その後 月 1,280 円・年 12,800 円</p>
            )}
          </>
        ) : (
          <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: 0 }}>アルコプラスは iPhone アプリではじめられます。</p>
        )
      )}

      {error && <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-error)", margin: "8px 0 0" }}>{error}</p>}
    </section>
  )
}
