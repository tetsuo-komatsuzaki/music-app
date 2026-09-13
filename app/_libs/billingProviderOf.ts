// 契約の提供元の判定 (2026-09-13 法務対応 CR-L3-01)。
//
// User.billingProvider は Apple の経路 (appleServer.applyTransaction) と Stripe の webhook (subscriptionToUserFields) が書くが、
// 2026-09-13 より前の Stripe 契約者には書かれていない (バックフィル migration 20260913120000 で埋める)。
// 画面と退会処理はこの関数で導出した値を使い、列の空白に依存しない。

export type BillingProvider = "apple" | "stripe" | null

export type BillingProviderInput = {
  billingProvider?: string | null
  stripeSubscriptionId?: string | null
  planStatus?: string | null
}

/** Stripe の契約が生きている planStatus (stripe.ts の PLUS_STATUSES と同義) */
const STRIPE_LIVE_STATUSES = new Set(["trialing", "active", "past_due"])

/**
 * 契約の提供元。列に値があればそれを正とし、無ければ Stripe の加入歴 (stripeSubscriptionId) から "stripe" を導く。
 * Stripe の加入歴は解約後も残す設計なので、解約済みの人も "stripe" になる (Customer Portal で履歴を見られる)。
 */
export function resolveBillingProvider(u: BillingProviderInput): BillingProvider {
  if (u.billingProvider === "apple" || u.billingProvider === "stripe") return u.billingProvider
  if (u.stripeSubscriptionId) return "stripe"
  return null
}

/**
 * 退会時に Stripe の契約を確認すべきか。Stripe の加入歴 (stripeSubscriptionId) があれば true。
 * 生きているかどうかは DB の planStatus ではなく Stripe に問い合わせて決める (CR-L4-01: Web で契約した人が
 * その後 Apple でも契約すると planStatus と billingProvider は Apple の値に上書きされるため、DB では判定できない)。
 */
export function shouldCancelStripeOnDeletion(u: BillingProviderInput): boolean {
  return !!u.stripeSubscriptionId
}

/** Stripe の subscription.status が「生きている」か (trialing / active / past_due) */
export function isStripeLiveStatus(status: string | null | undefined): boolean {
  return STRIPE_LIVE_STATUSES.has(status ?? "")
}

/**
 * 退会モーダルの注記に使う提供元。Apple の契約者は常に "apple"。
 * Stripe は契約が生きている人だけ "stripe" (解約済みの加入歴だけの人に「退会と同時に解約されます」と言わない・CR-L4-09)。
 */
export function billingNoteProvider(u: BillingProviderInput): BillingProvider {
  const p = resolveBillingProvider(u)
  if (p === "stripe") return isStripeLiveStatus(u.planStatus) ? "stripe" : null
  return p
}
