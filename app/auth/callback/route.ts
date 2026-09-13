import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { RETURN_TO_COOKIE, mapReturnToForUser, safeReturnPath } from "@/app/_libs/returnTo"
import { prisma } from "@/app/_libs/prisma"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    }
  )

  let authUserId: string | null = null
  if (code) {
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    const u = data?.user ?? null
    const providerRefresh = data?.session?.provider_refresh_token ?? null
    authUserId = u?.id ?? null
    // ゲストの昇格 (2026-09-12 要件整理 v2.7 §4): 匿名ユーザーに Apple の identity が結びついたら、
    // 同じ UUID のまま role を guest → student に。Apple の氏名は仮の名前として入れ、オンボ (SCR-02b) で上書きする
    if (u && !u.is_anonymous) {
      const providers = (u.app_metadata?.providers as string[] | undefined) ?? []
      if (providers.includes("apple")) {
        const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string }
        const appleName = (meta.full_name || meta.name || "").trim()
        await prisma.user.updateMany({
          where: { supabaseUserId: u.id, role: "guest" },
          // 氏名が取れない (2 回目以降のサインイン) なら仮名「ゲスト」を「あなた」に (AMB-004・CR-1-16)。SCR-02b で上書きされる
          data: { role: "student", guestDeviceKey: null, guestExpiresAt: null, name: appleName || "あなた" },
        })
        // Apple で初めて来た人 (匿名を経ていない) には User 行が無い。ここで作る
        const exists = await prisma.user.findUnique({ where: { supabaseUserId: u.id }, select: { id: true } })
        if (!exists) {
          await prisma.user.create({ data: { supabaseUserId: u.id, name: appleName || "あなた", role: "student", plan: "free" } })
        }
        // 退会時のトークン失効 (5.1.1(v)) に使う refresh token を保持
        if (providerRefresh) await prisma.user.updateMany({ where: { supabaseUserId: u.id }, data: { appleRefreshToken: providerRefresh } })
      }
    }
  }
  // ゲスト閲覧 (2026-09-06): ゲートから Google 認証に来た場合、cookie の戻り先 (/guest/...) を本人の URL にして送る
  const rt = safeReturnPath(cookieStore.get(RETURN_TO_COOKIE)?.value)
  const dest = rt && authUserId ? mapReturnToForUser(rt, authUserId) : "/"
  const res = NextResponse.redirect(new URL(dest, request.url))
  if (rt) res.cookies.set({ name: RETURN_TO_COOKIE, value: "", path: "/", maxAge: 0 })
  return res
}