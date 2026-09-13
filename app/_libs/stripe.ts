// Stripe クライアント + サブスク→User 反映の写像 (課金 Phase 2, 2026-08-07)
//
// 方針: Stripe が正・DB は写し。webhook (app/api/stripe/webhook) だけが
// plan/planStatus/planCurrentPeriodEnd を書く。アプリ側は読むだけ。
import Stripe from "stripe"

let _stripe: Stripe | null = null

/** 遅延初期化 (ビルド時に env が無くても落ちないように) */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY が未設定です")
  if (!_stripe) _stripe = new Stripe(key)
  return _stripe
}

/** Stripe 課金が構成済みか (未構成の間は設定ページにプラン欄を出さない) */
export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_PRICE_MONTHLY &&
    process.env.STRIPE_PRICE_YEARLY,
  )
}

/** プラス扱いになる subscription.status (plan.ts の PLUS_STATUSES と同義・写像側の正) */
const PLUS_STATUSES = new Set(["trialing", "active", "past_due"])

export type SubscriptionUserFields = {
  plan: "plus" | null
  planStatus: string
  planCurrentPeriodEnd: Date | null
  stripeSubscriptionId: string
  /** 2026-09-13 (CR-L3-01): Stripe の経路でも提供元を書く。既存行は migration 20260913120000 でバックフィル */
  billingProvider: "stripe"
}

/**
 * Stripe Subscription → User 更新フィールド。純関数 (テスト対象)。
 * current_period_end は API 版によって subscription 直下 or items 側にある
 * (2025-03-31 Basil で items へ移動) ため両対応で読む。
 */
export function subscriptionToUserFields(sub: {
  id: string
  status: string
  current_period_end?: number | null
  items?: { data?: Array<{ current_period_end?: number | null }> }
}): SubscriptionUserFields {
  const endSec = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null
  return {
    plan: PLUS_STATUSES.has(sub.status) ? "plus" : null,
    planStatus: sub.status,
    planCurrentPeriodEnd: endSec != null ? new Date(endSec * 1000) : null,
    // 解約(deleted)でも旧 sub.id を残す (加入歴の記録)。
    // 2026-09-12: トライアルを削除したので「再トライアル不可」の判定には使わなくなったが、
    // 加入歴そのものは他でも参照しうるので null にはしない。
    stripeSubscriptionId: sub.id,
    billingProvider: "stripe",
  }
}

