// POST /api/stripe/portal
//
// 課金 Phase 2 (2026-08-07): 解約・カード変更・請求履歴は Stripe Customer Portal に丸投げ。
// 解約画面は自作しない (誤実装で解約できない事故を避ける)。
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { getStripe } from "@/app/_libs/stripe"
import { logError } from "@/app/_libs/logError"

export async function POST(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const user = await prisma.user.findUnique({
    where: { id: auth.user.dbUser.id },
    select: { stripeCustomerId: true },
  })
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "契約がありません" }, { status: 404 })
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${request.nextUrl.origin}/${auth.user.supabaseUser.id}/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    logError("stripe.portal", e)
    return NextResponse.json({ error: "管理ページの作成に失敗しました" }, { status: 500 })
  }
}
