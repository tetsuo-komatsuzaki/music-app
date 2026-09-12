// /start — 「アルコプラスをはじめる」(2026-09-12 要件整理 v2.7 §3・モック v3)。
// 登録と決済を分けない、アルコダ側のただ 1 枚。ここから Sign in with Apple → 購入シート → オンボーディング。
// 入口: 結果カードの「残してつづける」・使用済みゲートの「はじめる」・ゲストホームのカード・契約切れの「再開する」。
// Web (ブラウザ) では売らないので、App Store への案内だけを出す。
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import StartClient from "./StartClient"

export const dynamic = "force-dynamic"

export default async function StartPage({ searchParams }: { searchParams?: Promise<{ step?: string; plan?: string }> }) {
  const sp = (await searchParams) ?? {}
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let session: "none" | "anon" | "user" = "none"
  let hasApple = false
  let onboarded = false
  if (user) {
    session = user.is_anonymous ? "anon" : "user"
    hasApple = ((user.app_metadata?.providers as string[] | undefined) ?? []).includes("apple")
    if (!user.is_anonymous) {
      const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id }, select: { id: true } })
      if (dbUser) {
        const onb = await prisma.onboardingProfile.findUnique({ where: { userId: dbUser.id }, select: { completedAt: true } })
        onboarded = !!onb?.completedAt
      }
    }
  }
  return (
    <StartClient
      session={session}
      hasApple={hasApple}
      authUserId={user?.id ?? null}
      onboarded={onboarded}
      resumeStep={sp.step === "purchase" || sp.step === "restore" ? sp.step : null}
      resumePlan={sp.plan === "month" ? "monthly" : "yearly"}
    />
  )
}
