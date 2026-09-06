import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { RETURN_TO_COOKIE, mapReturnToForUser, safeReturnPath } from "@/app/_libs/returnTo"

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
    authUserId = data?.user?.id ?? data?.session?.user?.id ?? null
  }
  // ゲスト閲覧 (2026-09-06): ゲートから Google 認証に来た場合、cookie の戻り先 (/guest/...) を本人の URL にして送る
  const rt = safeReturnPath(cookieStore.get(RETURN_TO_COOKIE)?.value)
  const dest = rt && authUserId ? mapReturnToForUser(rt, authUserId) : "/"
  const res = NextResponse.redirect(new URL(dest, request.url))
  if (rt) res.cookies.set({ name: RETURN_TO_COOKIE, value: "", path: "/", maxAge: 0 })
  return res
}