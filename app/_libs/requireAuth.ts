import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "./supabaseServer"
import { prisma } from "./prisma"
import { unauthorizedResponse } from "./authResponses"
import type { Role } from "@/app/generated/prisma"

export type AuthedUser = {
  supabaseUser: { id: string; email?: string | null }
  dbUser: { id: string; role: Role; supabaseUserId: string }
}

/** API Route 用: 認証失敗時は NextResponse を返す */
export async function requireAuthApi(): Promise<
  | { ok: true; user: AuthedUser }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      response: unauthorizedResponse(),
    }
  }
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true, supabaseUserId: true },
  })
  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "User not found" }, { status: 404 }),
    }
  }
  return {
    ok: true,
    user: { supabaseUser: { id: user.id, email: user.email }, dbUser },
  }
}

/** Server Action 用: 認証失敗時は error 文字列を返す */
export async function requireAuthAction(): Promise<
  | { ok: true; user: AuthedUser }
  | { ok: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true, supabaseUserId: true },
  })
  if (!dbUser) return { ok: false, error: "User未登録" }

  return {
    ok: true,
    user: { supabaseUser: { id: user.id, email: user.email }, dbUser },
  }
}

/** 管理者限定 Server Action 用 */
export async function requireAdminAction(): Promise<
  | { ok: true; user: AuthedUser }
  | { ok: false; error: string }
> {
  const result = await requireAuthAction()
  if (!result.ok) return result
  if (result.user.dbUser.role !== "admin") {
    return { ok: false, error: "管理者権限が必要です" }
  }
  return result
}
