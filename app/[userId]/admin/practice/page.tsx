import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { redirect } from "next/navigation"
import AdminPractice from "../adminPractice"
import { uploadPracticeItem } from "@/app/actions/uploadPracticeItem"

export default async function AdminPracticePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
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

  // 登録済みアイテム一覧
  const items = await prisma.practiceItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: {
      techniques: {
        include: { techniqueTag: { select: { id: true, name: true } } },
      },
    },
  })

  // TechniqueTag 一覧（フォームの選択肢用）
  const techniqueTags = await prisma.techniqueTag.findMany({
    where: { implementStatus: "実装" },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, category: true, name: true, nameEn: true },
  })

  // カテゴリでグルーピング
  const tagsByCategory: Record<string, typeof techniqueTags> = {}
  for (const tag of techniqueTags) {
    if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = []
    tagsByCategory[tag.category].push(tag)
  }

  const itemDtos = items.map((item) => ({
    id: item.id,
    category: item.category,
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
    techniques: item.techniques.map((t) => ({
      id: t.techniqueTag.id,
      name: t.techniqueTag.name,
      isPrimary: t.isPrimary,
    })),
  }))

  return (
    <AdminPractice
      items={itemDtos}
      tagsByCategory={tagsByCategory}
      uploadAction={uploadPracticeItem}
    />
  )
}
