// ライブラリ (2026-08-17 ナビ要件定義 SECTION 02)。
// 弾くものを選ぶ場所として、曲 / 基礎練 / マイ楽譜 を1画面のセグメントで束ねる。
// 旧・練習メニュー (/practice) の役割を吸収する。既存ルートは残置。
import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { BASIC_PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"
import type { PracticeCategory } from "@/app/generated/prisma"
import { LESSON_TOTAL } from "@/app/[userId]/lessons/_lib/content"
import { badgeKind } from "@/app/_libs/starProgress"
import { resolveEffectivePlan } from "@/app/_libs/plan"
import LibraryClient, { type LibraryPiece, type LibraryCategory } from "./LibraryClient"
import { loadPieceCatalog } from "./loadPieceCatalog"

export const metadata = { title: "ライブラリ" }

const ALL_PRACTICE_CATEGORIES = [...BASIC_PRACTICE_CATEGORIES, "etude"] as const

export default async function LibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)

  const ownerFilter = { OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }] }

  const [scores, counts, achievements, ownScoreCount, me, catalog] = await Promise.all([
    // 曲: 公開曲 + 自分の曲
    prisma.score.findMany({
      where: {
        deletedAt: null,
        OR: [{ isShared: true }, { createdById: dbUserId }],
      },
      orderBy: [{ star: "asc" }, { createdAt: "desc" }],
      select: {
        id: true, title: true, composer: true, star: true,
        createdById: true, coverImagePath: true,
      },
      take: 60,
    }),
    Promise.all(
      ALL_PRACTICE_CATEGORIES.map((cat) =>
        prisma.practiceItem.count({
          where: { category: cat as PracticeCategory, isPublished: true, ...ownerFilter },
        }),
      ),
    ),
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUserId },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
    prisma.score.count({ where: { createdById: dbUserId, deletedAt: null } }),
    // アップロードは有料プラン限定 (要件定義 2-4)
    prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true, planStatus: true, createdAt: true },
    }),
    // 曲タブ = 曲カタログ (2026-08-21 曲をさがす統合)
    loadPieceCatalog(dbUserId),
  ])

  const canUpload = me
    ? resolveEffectivePlan({ plan: me.plan, planStatus: me.planStatus, createdAt: me.createdAt }) === "plus"
    : false

  const achByScore = new Map(achievements.map((a) => [a.scoreId, a]))

  const pieces: LibraryPiece[] = scores.map((s) => ({
    id: s.id,
    title: s.title,
    composer: s.composer,
    star: s.star,
    mine: s.createdById === dbUserId,
    badge: badgeKind(achByScore.get(s.id)),
  }))

  const categories: LibraryCategory[] = ALL_PRACTICE_CATEGORIES.map((cat, i) => ({
    category: cat,
    count: counts[i],
  }))

  const tab = sp.tab === "basics" || sp.tab === "mine" ? sp.tab : "pieces"

  return (
    <LibraryClient
      userId={authUserId}
      initialTab={tab}
      pieces={pieces}
      catalog={catalog}
      categories={categories}
      lessonTotal={LESSON_TOTAL}
      ownScoreCount={ownScoreCount}
      canUpload={canUpload}
    />
  )
}
