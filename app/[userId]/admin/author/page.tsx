import { redirect } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import type { AuthorScore } from "@/app/_libs/author/model"
import AuthorEditor from "./AuthorEditor"

export const metadata = { title: "スコアを自分で作る" }

export default async function AuthorPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ item?: string }> }) {
  const { userId } = await params
  const { item } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id } })
  if (!dbUser || dbUser.role !== "admin") return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>

  const groupsRaw = await prisma.materialGroup.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }], select: { id: true, category: true, title: true } })
  const groups = groupsRaw.map((g) => ({ id: g.id, category: g.category as string, title: g.title }))

  let initial: { itemId: string; score: AuthorScore; star: number } | null = null
  let loadError: string | null = null
  if (item) {
    const pi = await prisma.practiceItem.findUnique({ where: { id: item }, select: { id: true, star: true, title: true } })
    if (!pi) loadError = "教材が見つかりません"
    else {
      const st = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!).storage.from("musicxml")
      const { data, error } = await st.download(`practice/${pi.id}/author.json`)
      if (error || !data) loadError = `「${pi.title}」はファイルで登録された教材です。ここで直せるのは、この画面で作った教材だけです`
      else {
        const parsed = JSON.parse(await data.text()) as AuthorScore & { star?: number }
        const { star: s, ...score } = parsed
        initial = { itemId: pi.id, score: score as AuthorScore, star: s ?? pi.star ?? 2 }
      }
    }
  }
  if (loadError) return <div style={{ padding: 40, textAlign: "center" }}>{loadError}<br /><a href={`/${userId}/admin/practice`} style={{ color: "#2b5bc4" }}>教材管理へ</a></div>
  return <AuthorEditor userId={userId} groups={groups} initial={initial} />
}
