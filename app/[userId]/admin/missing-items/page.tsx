// v1.6 Phase 6 (2026-05-18) — admin 管理画面: MissingPracticeItemFlag 一覧。
//
// Phase 3b で「3 カテゴリ (scale/arpeggio/etude) の教材が揃わず SubTask 生成
// skip」した時に立つフラグを admin に可視化し、不足教材作成 → グループ解決の
// 運用を回す。Phase 3c カスケード検証のブロッカー (教材不足) 解消ツール。
//
// グルーピング = (keyTonic, keyMode, star) → 配下に missingCategory 別集約。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { redirect } from "next/navigation"
import AdminMissingItems from "../adminMissingItems"
import { resolveMissingPracticeItemFlag } from "@/app/actions/resolveMissingPracticeItemFlag"
import { PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"

export const metadata = { title: "不足教材フラグ" }

// 基礎練6 + エチュード の表示順
const CATEGORY_ORDER = PRACTICE_CATEGORIES

export default async function AdminMissingItemsPage({
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

  const flags = await prisma.missingPracticeItemFlag.findMany({
    orderBy: [{ keyTonic: "asc" }, { keyMode: "asc" }, { star: "asc" }],
    select: {
      id: true,
      scoreId: true,
      subTaskType: true,
      missingCategory: true,
      keyTonic: true,
      keyMode: true,
      star: true,
      detectedAt: true,
      resolvedAt: true,
      score: { select: { title: true } },
    },
  })

  // (keyTonic, keyMode, star) → missingCategory 別に集約
  type CatAgg = {
    missingCategory: string
    unresolvedCount: number
    resolvedCount: number
    subTaskTypes: Set<string>
    scores: Map<string, string> // scoreId -> title (未解決のみ)
    earliestDetectedAt: string
    allResolved: boolean
  }
  type Group = {
    key: string
    keyTonic: string
    keyMode: string
    star: number
    categories: Map<string, CatAgg>
  }
  const groups = new Map<string, Group>()

  for (const f of flags) {
    const gKey = `${f.keyTonic}|${f.keyMode}|${f.star}`
    let g = groups.get(gKey)
    if (!g) {
      g = {
        key: gKey,
        keyTonic: f.keyTonic,
        keyMode: f.keyMode,
        star: f.star,
        categories: new Map(),
      }
      groups.set(gKey, g)
    }
    let c = g.categories.get(f.missingCategory)
    if (!c) {
      c = {
        missingCategory: f.missingCategory,
        unresolvedCount: 0,
        resolvedCount: 0,
        subTaskTypes: new Set(),
        scores: new Map(),
        earliestDetectedAt: f.detectedAt.toISOString(),
        allResolved: true,
      }
      g.categories.set(f.missingCategory, c)
    }
    c.subTaskTypes.add(f.subTaskType)
    if (f.detectedAt.toISOString() < c.earliestDetectedAt) {
      c.earliestDetectedAt = f.detectedAt.toISOString()
    }
    if (f.resolvedAt === null) {
      c.unresolvedCount += 1
      c.allResolved = false
      c.scores.set(f.scoreId, f.score?.title ?? "(不明)")
    } else {
      c.resolvedCount += 1
    }
  }

  const groupDtos = Array.from(groups.values()).map((g) => ({
    key: g.key,
    keyTonic: g.keyTonic,
    keyMode: g.keyMode,
    star: g.star,
    categories: Array.from(g.categories.values())
      .sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.missingCategory as (typeof CATEGORY_ORDER)[number]) -
          CATEGORY_ORDER.indexOf(b.missingCategory as (typeof CATEGORY_ORDER)[number]),
      )
      .map((c) => ({
        missingCategory: c.missingCategory,
        unresolvedCount: c.unresolvedCount,
        resolvedCount: c.resolvedCount,
        subTaskTypes: Array.from(c.subTaskTypes).sort(),
        scores: Array.from(c.scores.entries()).map(([id, title]) => ({
          id,
          title,
        })),
        earliestDetectedAt: c.earliestDetectedAt,
        allResolved: c.allResolved,
      })),
  }))

  const totalUnresolved = flags.filter((f) => f.resolvedAt === null).length

  return (
    <AdminMissingItems
      userId={userId}
      groups={groupDtos}
      totalUnresolved={totalUnresolved}
      totalFlags={flags.length}
      resolveAction={resolveMissingPracticeItemFlag}
    />
  )
}
