import "server-only"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "./supabaseServer"
import { prisma } from "./prisma"

/**
 * URL `[userId]` 配下の Server Component で使うヘルパー。
 *
 * 認証境界の責務分担:
 *  - middleware (`matcher` で `/[UUID]/*` を捕捉): URL ↔ session 一致検証 + path 保持型 redirect (主防御)
 *  - 本 helper: middleware bypass 時の二重防御 + Prisma User.id (cuid) lookup
 *
 * 失敗時の挙動 (通常 middleware で先に処理されるため fallback):
 *  - 未認証          → redirect("/login")
 *  - URL ID 不一致   → redirect(`/${session.user.id}`)
 *                       (middleware は path 保持型だが、helper まで到達するのは異常状態のため安全側で top に戻す)
 *  - DB user 不在    → redirect("/login")
 *                       (signUpAction で必ず作成されるため通常到達不能)
 *
 * caller は `params` を別途 `await` してから他フィールド (category, itemId 等) を取得する想定。
 * helper は ID 解決責務のみで params の他フィールドには関与しない。
 */
export type UserIds = {
  authUserId: string  // Supabase auth UUID (params.userId と一致)
  dbUserId: string    // Prisma User.id (cuid) — 全 DB foreign key (createdById / ownerUserId / userId) で使う値
}

export async function getUserIdsFromParams(
  params: { userId: string }
): Promise<UserIds> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  if (params.userId !== user.id) redirect(`/${user.id}`)

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) redirect("/login")

  return { authUserId: user.id, dbUserId: dbUser.id }
}
