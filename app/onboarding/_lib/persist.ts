// ============================================================
// オンボーディング確定保存のコア (C5・2026-07-12)
// actions.ts(認証ラッパー)から呼ぶトランザクション本体。
// 検証スクリプト(scripts/verify-onboarding-c5.ts)が rollback 付きで
// 直接実行できるよう、TransactionClient を受け取る形で分離。
// 冪等: completedAt 済みなら何も書かない。
// ============================================================

import type { Prisma } from "@/app/generated/prisma/client"

export type OnboardingDraftInput = {
  answers: Record<string, unknown>
  ladder: Record<string, unknown>
  screen: string
  seg: Record<string, number>
  star: number | null
}

export type CompleteOnboardingInput = OnboardingDraftInput & {
  flags: Array<{ tagType: string; tagKey: string }>
  songRequest: string | null
}

export async function completeOnboardingTx(
  tx: Prisma.TransactionClient,
  dbUserId: string,
  input: CompleteOnboardingInput,
): Promise<{ alreadyDone: boolean }> {
  // 冪等ガード(トランザクション内で再確認)
  const existing = await tx.onboardingProfile.findUnique({
    where: { userId: dbUserId },
    select: { completedAt: true },
  })
  if (existing?.completedAt) return { alreadyDone: true }

  const star = input.star ?? 1

  // ① 完了記録(回答一式ごと確定)
  await tx.onboardingProfile.upsert({
    where: { userId: dbUserId },
    create: {
      userId: dbUserId,
      answers: input.answers as Prisma.InputJsonValue,
      ladder: input.ladder as Prisma.InputJsonValue,
      screen: "SCR12",
      seg: input.seg as Prisma.InputJsonValue,
      star,
      completedAt: new Date(),
    },
    update: {
      answers: input.answers as Prisma.InputJsonValue,
      ladder: input.ladder as Prisma.InputJsonValue,
      screen: "SCR12",
      seg: input.seg as Prisma.InputJsonValue,
      star,
      completedAt: new Date(),
    },
  })

  // ② 確定★ → UserStarProgress (既存値より下げない)
  const sp = await tx.userStarProgress.findUnique({ where: { userId: dbUserId } })
  const target = Math.max(sp?.currentStar ?? 1, star)
  await tx.userStarProgress.upsert({
    where: { userId: dbUserId },
    create: { userId: dbUserId, currentStar: target },
    update: { currentStar: target },
  })

  // ③ 仮習得タグ(全てPROVISIONAL・冪等)
  if (input.flags.length > 0) {
    await tx.userTagAcquisition.createMany({
      data: input.flags.map((f) => ({
        userId: dbUserId,
        tagType: f.tagType,
        tagKey: f.tagKey,
        state: "PROVISIONAL",
        source: "onboarding",
      })),
      skipDuplicates: true,
    })
  }

  // ④ 診断予約(= 初回演奏時の仮習得検証の予約。常時診断は工程Cで充足済み)
  await tx.user.update({
    where: { id: dbUserId },
    data: { diagnosisReservedAt: new Date() },
  })

  // ⑤ 未収録曲リクエスト(同名の既存リクエストは重複させない=冪等)
  if (input.songRequest) {
    const dup = await tx.songRequest.findFirst({
      where: { userId: dbUserId, songName: input.songRequest },
    })
    if (!dup) {
      await tx.songRequest.create({
        data: { userId: dbUserId, songName: input.songRequest, source: "onboarding" },
      })
    }
  }

  return { alreadyDone: false }
}
