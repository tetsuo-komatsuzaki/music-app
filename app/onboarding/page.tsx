// /onboarding — サーバーページ (C5・2026-07-12)
// - 要ログイン(未ログイン→/login)
// - 完了済み(OnboardingProfile.completedAt)→ホームへ(再オンボ防止)
// - 曲カタログはDBが正(空/失敗時はモックJSONフォールバック)
// - サーバードラフトを渡して端末をまたぐ中断復帰を可能にする
// 対象=全ユーザー(既存ユーザーも質問を受ける = Tetsuo確定 2026-07-12)

import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import OnboardingClient from "./onboardingClient"
import { CATALOG, type CatalogCategory } from "./_lib/catalog"
import type { OnboardingPublicState } from "./_lib/store"

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) redirect("/login")

  const homePath = `/${user.id}`

  const [profile, songs] = await Promise.all([
    prisma.onboardingProfile.findUnique({ where: { userId: dbUser.id } }),
    prisma.onboardingSong.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
  ])

  // 再オンボ防止(URL直打ち対策)
  if (profile?.completedAt) redirect(homePath)

  // 曲カタログ: DBが正・空ならモックにフォールバック
  let catalog: Record<string, CatalogCategory> = CATALOG
  if (songs.length > 0) {
    const byCat: Record<string, CatalogCategory> = {}
    for (const key of Object.keys(CATALOG)) {
      byCat[key] = { label: CATALOG[key].label, ico: CATALOG[key].ico, songs: [] }
    }
    for (const s of songs) {
      if (!byCat[s.category]) continue
      byCat[s.category].songs.push([s.name, s.star])
    }
    catalog = byCat
  }

  // サーバードラフト(中断復帰。localStorageより優先)。
  // result(★+仮習得)はストア側が ladder から決定的に再計算する。
  const serverDraft: Partial<OnboardingPublicState> | null = profile
    ? {
        screen: (profile.screen ?? "SCR01") as OnboardingPublicState["screen"],
        ans: (profile.answers ?? {}) as OnboardingPublicState["ans"],
        ladder: (profile.ladder ?? {}) as OnboardingPublicState["ladder"],
        seg: (profile.seg ?? {}) as OnboardingPublicState["seg"],
        history: [],
        songRequest: null,
      }
    : null

  return (
    <OnboardingClient catalog={catalog} homePath={homePath} serverDraft={serverDraft} />
  )
}
