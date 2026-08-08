// POST /api/stripe/webhook
//
// 課金 Phase 2 (2026-08-07): Stripe → User の唯一の反映点。
// Stripe が正・DB は写し。plan/planStatus/planCurrentPeriodEnd を書くのはここだけ。
// 署名検証があるため認証 (requireAuth) は使わない。冪等: 同じ subscription 状態を
// 何度受けても同じ行に上書きするだけなので再送に安全。
import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { prisma } from "@/app/_libs/prisma"
import { getStripe, subscriptionToUserFields } from "@/app/_libs/stripe"
import { logError } from "@/app/_libs/logError"

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 })

  const signature = request.headers.get("stripe-signature")
  if (!signature) return NextResponse.json({ error: "signature missing" }, { status: 400 })

  let event: Stripe.Event
  try {
    const payload = await request.text()
    event = getStripe().webhooks.constructEvent(payload, signature, secret)
  } catch (e) {
    logError("stripe.webhook.signature", e)
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      // 加入完了。subscription イベントと重複して届くが同じ内容の上書きなので問題ない。
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription" || !session.subscription) break
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id
        const sub = await getStripe().subscriptions.retrieve(subId)
        await applySubscription(sub, session.client_reference_id)
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // 順不同配送対策 (2026-08-08): イベントのスナップショットは古い可能性があるため、
        // checkout.session.completed と同様に「今の subscription」を取り直して反映する。
        // これで「古い updated が新しい状態を上書きして解約済みが plus に戻る」等を防ぐ。
        const snap = event.data.object as Stripe.Subscription
        const sub = await getStripe().subscriptions.retrieve(snap.id)
        await applySubscription(sub, null)
        break
      }
      case "customer.subscription.deleted": {
        // deleted は取り直すと 404 になりうる。届いた時点で終端状態 (canceled) が確定しており、
        // 写像は plan:null に落とすだけなので、そのまま反映して問題ない。
        await applySubscription(event.data.object as Stripe.Subscription, null)
        break
      }
      default:
        break // 関心のないイベントは 200 で流す (Stripe の再送を止める)
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    logError("stripe.webhook.handler", e, { eventType: event.type })
    return NextResponse.json({ error: "handler failed" }, { status: 500 }) // 500 → Stripe が再送
  }
}

/** subscription の状態を該当 User に反映。対象ユーザーは customerId → 予備で dbUserId で特定 */
async function applySubscription(sub: Stripe.Subscription, dbUserIdHint: string | null | undefined) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const fields = subscriptionToUserFields(sub)

  const byCustomer = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: fields,
  })
  if (byCustomer.count > 0) return

  // 予備経路: customerId 未保存 (checkout 前の保存が失敗した等) → metadata / client_reference_id で復旧
  const dbUserId = dbUserIdHint ?? sub.metadata?.dbUserId
  if (dbUserId) {
    await prisma.user.updateMany({
      where: { id: dbUserId },
      data: { ...fields, stripeCustomerId: customerId },
    })
    return
  }
  logError("stripe.webhook.orphan", new Error("no user for customer"), { customerId, subId: sub.id })
}
