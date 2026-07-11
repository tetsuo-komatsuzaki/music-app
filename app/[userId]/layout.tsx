// app/[userId]/layout.tsx — サーバーレイアウト (オンボーディングC6・2026-07-12)
//
// オンボーディング未完了ガードをここ(全 /[userId]/* の入口)で行う。
// C6検証で発覚: ログイン後の着地は /scores のためホームページ単独のガードでは
// 素通りする → レイアウトに移設して全入口をカバー。
// 本人閲覧時のみ発動(他人のページ閲覧では誘導しない)。既存ユーザーも対象(Tetsuo確定)。
// 旧クライアントレイアウトは userShell.tsx に分離。

import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
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

  if (sessionUser?.id === userId) {
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: userId },
      select: { id: true },
    })
    if (dbUser) {
      const onb = await prisma.onboardingProfile.findUnique({
        where: { userId: dbUser.id },
        select: { completedAt: true },
      })
      if (!onb?.completedAt) redirect("/onboarding")
    }
  }

  return <UserShell>{children}</UserShell>
}
