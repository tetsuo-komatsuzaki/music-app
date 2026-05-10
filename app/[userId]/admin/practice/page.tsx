import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { redirect } from "next/navigation"
import AdminPractice from "../adminPractice"
import { uploadPracticeItem } from "@/app/actions/uploadPracticeItem"
import { uploadScore } from "@/app/actions/uploadScore"

export const metadata = { title: "教材管理" }

export default async function AdminPracticePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  void params // userId は admin 権限チェック後に supabase user 経由で利用
  // 管理者チェック
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin")  {
    return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
  }

  // 登録済み教材 (PracticeItem + Score) を並列で取得
  const [items, scores, techniqueTags] = await Promise.all([
    prisma.practiceItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      include: {
        techniques: {
          include: { techniqueTag: { select: { id: true, name: true } } },
        },
      },
    }),
    // 削除済み (deletedAt != null) は除外
    prisma.score.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        composer: true,
        keyTonic: true,
        keyMode: true,
        defaultTempo: true,
        isShared: true,
        analysisStatus: true,
        buildStatus: true,
        star: true,
        skillSubTaskTags: true,
      },
    }),
    // TechniqueTag 一覧（フォームの選択肢用）
    prisma.techniqueTag.findMany({
      where: { implementStatus: "実装" },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, category: true, name: true, nameEn: true },
    }),
  ])

  // カテゴリでグルーピング
  const tagsByCategory: Record<string, typeof techniqueTags> = {}
  for (const tag of techniqueTags) {
    if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = []
    tagsByCategory[tag.category].push(tag)
  }

  const itemDtos = items.map((item) => {
    const tags = Array.isArray(item.skillSubTaskTags)
      ? (item.skillSubTaskTags as unknown[]).filter((v): v is string => typeof v === "string")
      : []
    return {
      type: "practice" as const,
      id: item.id,
      category: item.category as string,
      title: item.title,
      composer: item.composer,
      keyTonic: item.keyTonic,
      keyMode: item.keyMode,
      tempoMin: item.tempoMin,
      tempoMax: item.tempoMax,
      positions: item.positions,
      isPublished: item.isPublished,
      analysisStatus: item.analysisStatus,
      buildStatus: item.buildStatus,
      star: item.star,
      skillSubTaskTags: tags,
      techniques: item.techniques.map((t) => ({
        id: t.techniqueTag.id,
        name: t.techniqueTag.name,
        isPrimary: t.isPrimary,
      })),
    }
  })

  // Score も同形に整形 (PracticeItem に存在しないフィールドは空 / null)
  const scoreDtos = scores.map((s) => {
    const tags = Array.isArray(s.skillSubTaskTags)
      ? (s.skillSubTaskTags as unknown[]).filter((v): v is string => typeof v === "string")
      : []
    return {
      type: "score" as const,
      id: s.id,
      category: "score" as const,
      title: s.title,
      composer: s.composer,
      keyTonic: s.keyTonic ?? "",
      keyMode: s.keyMode ?? "",
      tempoMin: s.defaultTempo,
      tempoMax: null,
      positions: [] as string[],
      isPublished: s.isShared, // Score の "公開" 相当は isShared
      analysisStatus: s.analysisStatus,
      buildStatus: s.buildStatus,
      star: s.star,
      skillSubTaskTags: tags,
      techniques: [] as { id: string; name: string; isPrimary: boolean }[],
    }
  })

  // 統合一覧 (PracticeItem 先 + Score 後)
  const allItems = [...itemDtos, ...scoreDtos]

  return (
    <AdminPractice
      items={allItems}
      tagsByCategory={tagsByCategory}
      uploadAction={uploadPracticeItem}
      uploadScoreAction={uploadScore}
    />
  )
}
