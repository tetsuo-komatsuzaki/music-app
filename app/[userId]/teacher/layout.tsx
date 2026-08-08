// /teacher 配下の共通ガード (2026-08-08 テスト調査の発見#2対応)。
// 従来は各 page が個別に role チェックしていたため、ページ描画より先に
// loading/タイトルが一瞬見えていた。layout で先に判定して非先生を締め出す。
// 将来 teacher 配下にページを追加したときのチェック漏れ防止 (defense-in-depth) も兼ねる。
// 各ページ側の既存チェックはそのまま残す (二重でも害はない)。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { role: true },
  })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  return <>{children}</>
}
