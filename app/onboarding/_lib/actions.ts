"use server"

// ============================================================
// オンボーディング サーバー保存 (C5・2026-07-12)
//  - saveOnboardingDraft: 画面遷移ごとのドラフト保存(サーバーが正・失敗は無視)
//  - completeOnboarding: 完了確定(冪等)。本体は _lib/persist.ts の
//    completeOnboardingTx (検証スクリプトが rollback 付きで直接実行できる形)。
// ============================================================

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import type { Prisma } from "@/app/generated/prisma/client"
import {
  completeOnboardingTx,
  type CompleteOnboardingInput,
  type OnboardingDraftInput,
} from "./persist"

async function requireDbUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, supabaseUserId: true },
  })
}

export async function saveOnboardingDraft(
  draft: OnboardingDraftInput,
): Promise<{ ok: boolean }> {
  const dbUser = await requireDbUser()
  if (!dbUser) return { ok: false }
  // 完了済みプロファイルはドラフトで上書きしない(再入場ガードの二重防御)
  const existing = await prisma.onboardingProfile.findUnique({
    where: { userId: dbUser.id },
    select: { completedAt: true },
  })
  if (existing?.completedAt) return { ok: false }

  const data = {
    answers: draft.answers as Prisma.InputJsonValue,
    ladder: draft.ladder as Prisma.InputJsonValue,
    screen: draft.screen,
    seg: draft.seg as Prisma.InputJsonValue,
    star: draft.star,
  }
  await prisma.onboardingProfile.upsert({
    where: { userId: dbUser.id },
    create: { userId: dbUser.id, ...data },
    update: data,
  })
  return { ok: true }
}

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<{ ok: boolean; alreadyDone?: boolean; homePath?: string; error?: string }> {
  const dbUser = await requireDbUser()
  if (!dbUser) return { ok: false, error: "未ログイン" }
  const homePath = `/${dbUser.supabaseUserId}`

  const { alreadyDone } = await prisma.$transaction((tx) =>
    completeOnboardingTx(tx, dbUser.id, input),
  )
  return { ok: true, alreadyDone, homePath }
}
