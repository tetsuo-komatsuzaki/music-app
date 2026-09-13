// app/[userId]/layout.tsx — サーバーレイアウト (オンボーディングC6・2026-07-12)
//
// オンボーディング未完了ガードをここ(全 /[userId]/* の入口)で行う。
// C6検証で発覚: ログイン後の着地は /scores のためホームページ単独のガードでは
// 素通りする → レイアウトに移設して全入口をカバー。
// 本人閲覧時のみ発動(他人のページ閲覧では誘導しない)。既存ユーザーも対象(Tetsuo確定)。
// 旧クライアントレイアウトは userShell.tsx に分離。

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import type { ReactNode } from "react"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { GUEST_ID } from "@/app/_libs/viewer"
import { isAppleBilling } from "@/app/_libs/billingMode"
import { resolveEffectivePlan } from "@/app/_libs/plan"
import UserShell from "./userShell"

export default async function UserLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser()

  // ゲスト閲覧 (2026-09-06): /guest/... はログインなしで一覧を見せる。ログイン中の人が来たら自分の URL へ。
  if (userId === GUEST_ID) {
    // 匿名ユーザー (1 回ためし中) はアカウントではないので /guest のまま見せる。
    // ここで本人 URL へ送ると、下の role=guest の分岐が /guest へ送り返して無限リダイレクトになる (2026-09-13 検証ループ CR-1-02)
    if (sessionUser && !sessionUser.is_anonymous) redirect(`/${sessionUser.id}`)
    return <UserShell>{children}</UserShell>
  }

  // 本人閲覧時のみ role を取得し、先生モード切替UIの表示判定に渡す (別シェル /teacher へのゲート)。
  let viewerRole: string | undefined
  if (sessionUser?.id === userId) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { id: true, role: true, plan: true, planStatus: true, createdAt: true, planGrant: true },
    })
    if (dbUser) {
      viewerRole = dbUser.role
      // ゲストの 1 回ためし (2026-09-12 要件整理 v2.7 §2): 匿名ユーザー (role = guest) はアカウントではない。
      // 開けるのは「ためす曲の詳細」だけで、それ以外はゲストと同じ範囲 (/guest/...) に戻す。オンボーディングも出さない。
      if (dbUser.role === "guest" && sessionUser.is_anonymous) {
        const path = (await headers()).get("x-pathname") ?? ""  // middleware が付ける
        const allowed = /^\/[0-9a-f-]{36}\/scores\/[A-Za-z0-9]+/.test(path)
        // path が取れないときも開けない側に倒す (CR-1-21)
        if (!allowed) redirect(path ? path.replace(`/${userId}`, `/${GUEST_ID}`) : `/${GUEST_ID}`)
        return <UserShell role={dbUser.role}>{children}</UserShell>
      }
      const onb = await prisma.onboardingProfile.findUnique({
        where: { userId: dbUser.id },
        select: { completedAt: true },
      })
      // Apple 課金ではオンボーディングは契約した人だけ (要件整理 v2.7 §0)。購入をキャンセルした契約なしのアカウントには出さない (CR-1-05)。
      // Stripe (従来) はオンボ → 決済の順なので契約を問わない
      const contracted = !isAppleBilling() || resolveEffectivePlan({ plan: dbUser.plan, planStatus: dbUser.planStatus, createdAt: dbUser.createdAt, planGrant: dbUser.planGrant }) !== "free"
      if (!onb?.completedAt && contracted) redirect("/onboarding")
    }
  }

  return <UserShell role={viewerRole}>{children}</UserShell>
}
