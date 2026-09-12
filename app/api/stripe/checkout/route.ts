// POST /api/stripe/checkout  body: { interval: "month" | "year" }
//
// 課金 Phase 2 (2026-08-07): アルコプラス加入の入口。
// Stripe Checkout (ホスト型・Apple Pay 自動対応) のセッションを作り URL を返す。
// 2026-09-12: 恒久的な「無料プラン」は存在しない。登録した時点でアルコプラスに入り、
// その最初の TRIAL_PERIOD_DAYS 日だけが無料期間になる。これを Stripe の
// trial_period_days で表現する (アプリ側で日数を二重に持たない)。
// 無料期間中 (trialing) は量に上限がかかり、自分の楽譜は使えない (plan.ts)。
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { getStripe, isBillingConfigured } from "@/app/_libs/stripe"
import { TRIAL_PERIOD_DAYS } from "@/app/_libs/plan"
import { logError } from "@/app/_libs/logError"

export async function POST(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUser = auth.user.dbUser

  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "課金は現在準備中です" }, { status: 503 })
  }

  let interval: "month" | "year" = "month"
  // next: 決済後に戻るアプリ内パス (2026-09-12)。オンボーディングから来た人は設定ではなく
  // ホームへ戻す。オープンリダイレクト防止のため「/」で始まる相対パスだけ受ける
  let next: string | null = null
  try {
    const body = await request.json()
    if (body?.interval === "year") interval = "year"
    if (typeof body?.next === "string" && /^\/[A-Za-z0-9_\-./?=&%]*$/.test(body.next) && !body.next.startsWith("//")) {
      next = body.next
    }
  } catch { /* body なしは月額扱い */ }

  const priceId = interval === "year" ? process.env.STRIPE_PRICE_YEARLY! : process.env.STRIPE_PRICE_MONTHLY!
  const stripe = getStripe()

  try {
    const user = await prisma.user.findUnique({
      where: { id: dbUser.id },
      select: { stripeCustomerId: true, stripeSubscriptionId: true, planStatus: true, name: true },
    })
    if (!user) return NextResponse.json({ error: "User未登録" }, { status: 404 })

    // すでに有効なサブスクがあるのに二重加入させない (契約変更は Customer Portal で)
    if (user.stripeSubscriptionId && user.planStatus && ["trialing", "active", "past_due"].includes(user.planStatus)) {
      return NextResponse.json({ error: "すでにアルコプラスに加入しています" }, { status: 409 })
    }

    // Stripe Customer は 1 ユーザー 1 つを維持 (無ければ作って保存)
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: user.name,
        email: auth.user.supabaseUser.email ?? undefined,
        metadata: { dbUserId: dbUser.id },
      })
      customerId = customer.id
      await prisma.user.update({ where: { id: dbUser.id }, data: { stripeCustomerId: customerId } })
    }

    const origin = request.nextUrl.origin
    const settingsUrl = `${origin}/${auth.user.supabaseUser.id}/settings`
    const returnBase = next ? `${origin}${next}` : settingsUrl
    const joiner = returnBase.includes("?") ? "&" : "?"
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_PERIOD_DAYS, metadata: { dbUserId: dbUser.id } },
      client_reference_id: dbUser.id,
      locale: "ja",
      allow_promotion_codes: true,
      success_url: `${returnBase}${joiner}billing=success`,
      cancel_url: `${returnBase}${joiner}billing=cancel`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    logError("stripe.checkout", e, { dbUserId: dbUser.id })
    return NextResponse.json({ error: "決済ページの作成に失敗しました" }, { status: 500 })
  }
}
