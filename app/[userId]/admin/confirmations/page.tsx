// 工程G (2026-07-11) — admin 管理画面: スタッカート系曖昧記号の確認キュー。
//
// 楽譜の点(・)は記号だけでは奏法を確定できない(§18-2 決定#4)ため、解析時に
// 「スタッカート仮付与 + TechniqueConfirmation キュー」が作られる。本画面で
// 管理者が一律4択から曲/教材単位で一括確定する(2026-07-11 Tetsuo確定)。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { redirect } from "next/navigation"
import AdminConfirmations, { type ConfirmationGroup } from "../adminConfirmations"

export const metadata = { title: "奏法の確認" }

export default async function AdminConfirmationsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
    )
  }

  const rows = await prisma.techniqueConfirmation.findMany({
    orderBy: [{ status: "desc" }, { updatedAt: "desc" }],
  })

  // 対象の曲/教材メタを一括取得
  const scoreIds = rows.filter((r) => r.targetType === "score").map((r) => r.targetId)
  const itemIds = rows.filter((r) => r.targetType === "practice").map((r) => r.targetId)
  const [scores, items] = await Promise.all([
    scoreIds.length
      ? prisma.score.findMany({
          where: { id: { in: scoreIds } },
          select: { id: true, title: true, star: true },
        })
      : [],
    itemIds.length
      ? prisma.practiceItem.findMany({
          where: { id: { in: itemIds } },
          select: { id: true, title: true, star: true, category: true },
        })
      : [],
  ])
  const scoreById = new Map(scores.map((s) => [s.id, s]))
  const itemById = new Map(items.map((i) => [i.id, i]))

  // 曲/教材単位にグルーピング (確定は曲単位一括)
  const groups = new Map<string, ConfirmationGroup>()
  for (const r of rows) {
    const key = `${r.targetType}:${r.targetId}`
    if (!groups.has(key)) {
      const meta =
        r.targetType === "score"
          ? scoreById.get(r.targetId)
          : itemById.get(r.targetId)
      groups.set(key, {
        targetType: r.targetType as "score" | "practice",
        targetId: r.targetId,
        title: meta?.title ?? "(削除済み)",
        star: meta?.star ?? null,
        category:
          r.targetType === "practice"
            ? (itemById.get(r.targetId)?.category ?? null)
            : null,
        status: "confirmed",
        resolvedTag: null,
        patterns: [],
      })
    }
    const g = groups.get(key)!
    g.patterns.push({
      pattern: r.pattern,
      noteCount: r.noteCount,
      measures: r.measures,
    })
    if (r.status === "pending") g.status = "pending"
    if (r.resolvedTag) g.resolvedTag = r.resolvedTag
  }

  return (
    <AdminConfirmations
      userId={userId}
      groups={Array.from(groups.values())}
    />
  )
}
