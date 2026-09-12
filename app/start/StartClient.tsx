"use client"

// 「アルコプラスをはじめる」の画面本体 (2026-09-12 要件整理 v2.7 §3 U-7・モック v3)。
//
// 流れ: プランを選ぶ → 「年額プランで Apple ではじめる」
//   1. セッションが無ければ Supabase の匿名ユーザーを作る (appAccountToken にする UUID が要る)
//   2. Apple の identity が無ければ Sign in with Apple (OAuth をアプリ内ブラウザで開き、arcoda://auth-callback で戻る。
//      Google ログインと同じ作法)。戻り先はこの画面の ?step=purchase なので、戻ったら 3 へ進む
//   3. StoreKit の購入シート (appAccountToken = UUID) → 確定したら /api/apple/verify で即反映 → ホームへ
//      (オンボーディング未完了なら [userId]/layout が /onboarding へ送る)
// 「購入を復元」も 2 まで同じで、そのあと StoreKit の権利を取り直して /api/apple/restore へ。
// × は置かない (ハードペイウォール・§8-2)。出口は「購入を復元」と「ゲストにもどる」だけ。
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { openAuthBrowser } from "@/app/_libs/arcodaAuthBrowser"
import { isNativeApp } from "@/app/_libs/isNativeApp"
import { appStoreUrl } from "@/app/_libs/billingMode"
import { useIsAppleFlowHere } from "@/app/_hooks/useIsNativeApp"
import { fetchProducts, purchase, restorePurchases, isStoreAvailable, type StoreProduct } from "@/app/_libs/appleStore"
import { getDeviceKey } from "@/app/_libs/deviceKey"
import { setReturnToCookie } from "@/app/_libs/returnTo"
import { ensureGuestUser } from "@/app/actions/guestTry"
import { recordGuestEvent } from "@/app/actions/recordGuestEvent"
import type { ApplePlanKind } from "@/app/_libs/planConstants"
import { GUEST_ID } from "@/app/_libs/viewer"
import styles from "./start.module.css"

type Props = {
  session: "none" | "anon" | "user"
  hasApple: boolean
  authUserId: string | null
  onboarded: boolean
  resumeStep: "purchase" | "restore" | null
  resumePlan: ApplePlanKind
}

const AppleMark = () => (
  <svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true"><path fill="currentColor" d="M14.1 10.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-3.8zM11.7 3.4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" /></svg>
)

/** 「/年」「/月」の表示。Apple の period は ISO 8601 (P1Y / P1M) */
function unitOf(period: string): string {
  return period.startsWith("P1Y") ? "年" : "月"
}

/** 年額の「月あたり」。Apple の price (数値) と通貨から出す。数値が無ければ null */
function perMonth(p: StoreProduct | undefined): string | null {
  if (!p || typeof p.price !== "number" || !p.currencyCode) return null
  const v = Math.round(p.price / 12)
  try {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: p.currencyCode, maximumFractionDigits: 0 }).format(v).replace(/^￥/, "¥")
  } catch {
    return `${v}`
  }
}

export default function StartClient({ session, hasApple, authUserId, onboarded, resumeStep, resumePlan }: Props) {
  const router = useRouter()
  const [sel, setSel] = useState<ApplePlanKind>(resumePlan)
  const [products, setProducts] = useState<Record<ApplePlanKind, StoreProduct> | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ok" | "error">("loading")
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null)
  const [entered, setEntered] = useState(false)
  const resumed = useRef(false)
  // 殻かどうかはサーバーでは分からないので、ハイドレーション後に決まる (それまで枠だけ描く)
  const appleHere = useIsAppleFlowHere()

  const say = useCallback((text: string, warn = false) => {
    setToast({ text, warn })
    window.setTimeout(() => setToast(null), 2400)
  }, [])

  // 価格と期間は Apple から。取れなければ伏せて「読み込めませんでした」
  const load = useCallback(async () => {
    setLoadState("loading")
    if (!isStoreAvailable()) { setLoadState("error"); return }
    const p = await fetchProducts()
    if (!p) { setLoadState("error"); return }
    setProducts(p)
    setLoadState("ok")
  }, [])

  useEffect(() => { setEntered(true); void load(); void recordGuestEvent("start_screen", "generic", "/start") }, [load])

  const introEligible = products ? products[sel].introEligible : true

  /** 1. セッションを用意する (無ければ匿名)。戻り値はいまの authUserId */
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (authUserId) return authUserId
    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) { say("準備できませんでした。時間をおいてもう一度", true); return null }
    const r = await ensureGuestUser(await getDeviceKey())
    if (r.error) { say(r.error, true); return null }
    return data.user.id
  }, [authUserId, say])

  /** 2. Apple の identity を結びつける (OAuth)。戻ってきたら resumeStep で続きをする */
  const linkApple = useCallback(async (next: "purchase" | "restore"): Promise<void> => {
    const supabase = createBrowserSupabaseClient()
    const dest = `/start?step=${next}&plan=${sel === "monthly" ? "month" : "year"}`
    setReturnToCookie(dest)
    const opts = isNativeApp()
      ? { redirectTo: "arcoda://auth-callback", skipBrowserRedirect: true }
      : { redirectTo: `${location.origin}/auth/callback`, skipBrowserRedirect: true }
    const { data, error } = session === "none" || session === "anon"
      ? await supabase.auth.linkIdentity({ provider: "apple", options: opts })
      : await supabase.auth.signInWithOAuth({ provider: "apple", options: opts })
    if (error || !data?.url) { say("Apple でのサインインを開けませんでした", true); return }
    const opened = await openAuthBrowser(data.url)
    if (!opened) window.location.href = data.url
  }, [sel, session, say])

  /** 3. 購入 → 即反映 */
  const doPurchase = useCallback(async (uid: string) => {
    void recordGuestEvent("purchase_cancel", "generic", "/start") // 既定は「途中」。成功したら purchase_ok を追加で記録
    const r = await purchase(sel, uid)
    if (r.status === "cancel") { say("購入をやめました。いつでも再開できます"); return }
    if (r.status === "pending") { say("承認を待っています"); return }
    if (r.status === "error") { say(r.message, true); return }
    say("反映しています…")
    const res = await fetch("/api/apple/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jws: r.jws }) })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      say(d?.error === "conflict" ? "この契約は別のアカウントに結ばれています" : "確認できませんでした。購入を復元をお試しください", true)
      return
    }
    void recordGuestEvent("purchase_ok", "generic", "/start")
    router.replace("/")
  }, [sel, say, router])

  const doRestore = useCallback(async () => {
    const r = await restorePurchases()
    if (r.status === "error") { say(r.message, true); return }
    if (r.status === "none") { void recordGuestEvent("restore_none", "generic", "/start"); say("この Apple アカウントに契約はありません", true); return }
    const res = await fetch("/api/apple/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jws: r.transactions.map((t) => t.jws) }) })
    const d = await res.json().catch(() => ({}))
    if (res.status === 409 || d?.result === "conflict") { say("この契約は別のアカウントに結ばれています。そのアカウントでログインしてください", true); return }
    if (d?.result !== "ok") { void recordGuestEvent("restore_none", "generic", "/start"); say("この Apple アカウントに契約はありません", true); return }
    void recordGuestEvent("restore_ok", "generic", "/start")
    // 見つかったときはトーストではなく確認ダイアログ (殻では iOS のアラートになる)。読み終えてから移る
    window.alert(["契約が見つかりました", "この Apple アカウントのアルコプラスを、このアカウントに結びました。"].join(String.fromCharCode(10)))
    router.replace(onboarded ? "/" : "/onboarding")
  }, [say, router, onboarded])

  const onStart = useCallback(async () => {
    if (!appleHere || busy || loadState !== "ok") return
    setBusy(true)
    try {
      const uid = await ensureSession()
      if (!uid) return
      if (!hasApple) { await linkApple("purchase"); return }
      await doPurchase(uid)
    } finally {
      setBusy(false)
    }
  }, [appleHere, busy, loadState, ensureSession, hasApple, linkApple, doPurchase])

  const onRestore = useCallback(async () => {
    if (!appleHere || busy) return
    setBusy(true)
    try {
      const uid = await ensureSession()
      if (!uid) return
      if (!hasApple) { await linkApple("restore"); return }
      await doRestore()
    } finally {
      setBusy(false)
    }
  }, [appleHere, busy, ensureSession, hasApple, linkApple, doRestore])

  // Apple から戻ってきた直後: 続きを自動で
  useEffect(() => {
    if (!resumeStep || resumed.current || !hasApple || !authUserId || !appleHere) return
    if (resumeStep === "purchase" && loadState !== "ok") return
    resumed.current = true
    void recordGuestEvent("signin_ok", "generic", "/start")
    setBusy(true)
    const run = resumeStep === "purchase" ? doPurchase(authUserId) : doRestore()
    void run.finally(() => setBusy(false))
  }, [resumeStep, hasApple, authUserId, appleHere, loadState, doPurchase, doRestore])

  // ハイドレーション前: 中身を描かない (Web の案内が一瞬出るのを避ける)
  if (!entered) return <div className={styles.frame}><div className={styles.glow} /></div>

  // Web (ブラウザ): 売らない。App Store への案内だけ
  if (!appleHere) {
    const url = appStoreUrl()
    return (
      <div className={styles.frame}>
        <div className={styles.glow} />
        <div className={styles.webNote}>
          <h3>アルコプラスは<br />iPhone アプリではじめられます</h3>
          <p>App Store で「アルコ」をダウンロードしてください。</p>
          {url ? <a href={url}>App Store を開く</a> : <Link href={`/${GUEST_ID}`} className={styles.retry}>ゲストにもどる</Link>}
        </div>
      </div>
    )
  }

  const yearly = products?.yearly
  const monthly = products?.monthly
  const priceCls = loadState === "ok" ? styles.p : `${styles.p} ${styles.hidden}`
  const selLabel = sel === "yearly" ? "年額" : "月額"
  const selPrice = products ? `${products[sel].displayPrice}/${unitOf(products[sel].period)}` : ""

  return (
    <div className={`${styles.frame} ${entered ? styles.enter : ""}`}>
      <div className={styles.glow} />

      <div className={styles.hero}>
        <h3>あの憧れの曲まで、<br />毎日アルコと。</h3>
        <p>
          {introEligible ? <>弾くたびに採点。最初の 2 週間は無料で、<br />そのあとは選んだプランの料金です。</> : <>弾くたびに採点。<br />選んだプランの料金で、今日から再開できます。</>}
        </p>
      </div>

      <div className={styles.plans}>
        <button type="button" className={`${styles.plan} ${sel === "yearly" ? styles.sel : ""}`} onClick={() => setSel("yearly")}>
          <span className={styles.badge}>2ヶ月分お得</span>
          <div><div className={styles.t}>年額</div><div className={styles.s}>{perMonth(yearly) ? `月あたり ${perMonth(yearly)!.replace("¥", "")}円で毎日採点できます` : "毎日採点できます"}</div></div>
          <div className={priceCls}>{yearly ? <>{yearly.displayPrice}<small>/{unitOf(yearly.period)}</small></> : <>—</>}</div>
          <span className={styles.chk} />
        </button>
        <button type="button" className={`${styles.plan} ${sel === "monthly" ? styles.sel : ""}`} onClick={() => setSel("monthly")}>
          <div><div className={styles.t}>月額</div><div className={styles.s}>1か月ごとに請求</div></div>
          <div className={priceCls}>{monthly ? <>{monthly.displayPrice}<small>/{unitOf(monthly.period)}</small></> : <>—</>}</div>
          <span className={styles.chk} />
        </button>
        {loadState === "error" && (
          <div className={styles.fine} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span>価格を読み込めませんでした。</span>
            <button type="button" className={styles.retry} onClick={() => void load()}>もう一度</button>
          </div>
        )}
      </div>

      <div className={styles.feats}>
        <h4>アルコプラスでできること</h4>
        <div className={styles.feat}><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></svg></i>採点が無制限になる</div>
        <div className={styles.feat}><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg></i>自分の楽譜を取り込んで採点できる</div>
        <div className={styles.feat}><i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9" /><path d="M3 3v6h6" /><path d="M12 7v5l3 2" /></svg></i>録音を 30 本まで残せる</div>
      </div>

      <div className={styles.dock}>
        <button type="button" className={`${styles.cta} ${busy ? styles.busy : ""}`} disabled={loadState !== "ok" || busy} onClick={() => void onStart()}>
          <AppleMark /><span>{selLabel}プランで Apple ではじめる</span>
        </button>
        <div className={styles.fine}>
          {introEligible
            ? <><b>最初の 2 週間は無料。</b>その後 {selPrice || "選んだプランの料金"} の定期請求。いつでも解約できます。</>
            : <>{selPrice || "選んだプランの料金"} の定期請求。いつでも解約できます。</>}
        </div>
        <div className={styles.legal}>
          <button type="button" onClick={() => void onRestore()}>購入を復元</button>
          <Link href="/terms">利用規約</Link>
          <Link href="/privacy">プライバシーポリシー</Link>
          <Link href={`/${GUEST_ID}`}>ゲストにもどる</Link>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.show : ""} ${toast?.warn ? styles.warn : ""}`}>{toast?.text ?? ""}</div>
    </div>
  )
}
