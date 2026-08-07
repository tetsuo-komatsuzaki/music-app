import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { resolveEffectivePlan } from "@/app/_libs/plan"
import { isBillingConfigured, isTrialEligible } from "@/app/_libs/stripe"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"

export const metadata = { title: "設定" }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params

  // 認証 + URL ↔ session 一致は helper 内部で完結 (失敗時は redirect 投げる)
  const { dbUserId } = await getUserIdsFromParams(p)

  // helper は ID のみ返すので、email / name は別途取得
  const supabase = await createServerSupabaseClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: dbUserId },
    select: {
      name: true, teacherEmailOff: true, createdAt: true,
      // ▼ 課金 Phase 2 (2026-08-07): プラン欄
      plan: true, planStatus: true, planCurrentPeriodEnd: true, stripeSubscriptionId: true,
    },
  })
  // helper を通過していれば dbUser は存在するはず、念のため
  if (!dbUser) redirect("/login")

  // プラン欄: restrictionStart=null で猶予経路を殺し「純粋な契約状態」だけを見る
  // (Stripe 未構成の間は billingEnabled=false で欄ごと非表示)
  const isPlus = resolveEffectivePlan({
    plan: dbUser.plan, planStatus: dbUser.planStatus, createdAt: dbUser.createdAt, restrictionStart: null,
  }) === "plus"

  // 先生がいる生徒だけ「先生からの通知」設定を出す
  let hasTeacher = false
  try {
    hasTeacher = !!(await prisma.teacherStudent.findFirst({ where: { studentId: dbUserId }, select: { id: true } }))
  } catch {
    hasTeacher = false
  }

  return (
    <SettingsClient
      userId={dbUserId}
      initialName={dbUser.name}
      currentEmail={authUser?.email ?? ""}
      accountDeletionEnabled={process.env.ENABLE_ACCOUNT_DELETION === "true"}
      hasTeacher={hasTeacher}
      teacherEmailOff={dbUser.teacherEmailOff}
      billing={{
        billingEnabled: isBillingConfigured(),
        isPlus,
        planStatus: dbUser.planStatus,
        periodEnd: dbUser.planCurrentPeriodEnd?.toISOString() ?? null,
        trialEligible: isTrialEligible(dbUser),
      }}
    />
  )
}
