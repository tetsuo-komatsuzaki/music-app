"use server"

import { requireAuthAction } from "@/app/_libs/requireAuth"

/**
 * 認証済みユーザー自身のロールを返す。
 * 引数は受け取らず、auth.getUser() で確認した本人のロールのみ開示する。
 */
export async function getUserRole(): Promise<string | null> {
  const result = await requireAuthAction()
  if (!result.ok) return null
  return result.user.dbUser.role
}
