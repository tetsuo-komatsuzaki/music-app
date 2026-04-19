import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { unauthorizedResponse } from "@/app/_libs/authResponses"

/**
 * 認証不要の /api/ パス（ホワイトリスト方式）。
 * 現状なし。将来の拡張（/api/health, /api/webhook/* 等）を見越して定数化。
 *
 * 書式:
 *   - 完全一致: "/api/health"
 *   - 前方一致: "/api/webhook/*"
 *     → "/api/webhook" 自体と "/api/webhook/<任意>" の両方にマッチ
 *     → "/api/webhooks-fake" のような類似パスは非マッチ（"/api/webhook/" で弾く）
 */
const PUBLIC_API_PATHS: readonly string[] = []

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_PATHS.some((pattern) => {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2)  // "/*" を除去
      return pathname === prefix || pathname.startsWith(prefix + "/")
    }
    return pathname === pattern
  })
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションをリフレッシュ（全リクエストで実行）
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // --- (Phase 1-3) /api/* 認証ガード（多層防御: API Route の requireAuthApi と二重化）---
  // PUBLIC_API_PATHS にマッチしないすべての /api/* で認証必須。
  // 未認証は 401 JSON + WWW-Authenticate + Cache-Control no-store で即終了。
  if (pathname.startsWith("/api/") && !isPublicApiPath(pathname)) {
    if (!user) {
      return unauthorizedResponse()
    }
  }

  // --- ユーザー専用ページ /[UUID]/* へのアクセス制御（既存挙動維持）---
  const isUserPage = pathname.match(/^\/([a-f0-9-]{36})(\/|$)/)

  if (isUserPage) {
    // 未ログイン → ログインページへ
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // 別ユーザーのURL → 自分のURLにリダイレクト
    const urlUserId = isUserPage[1]
    if (urlUserId !== user.id) {
      const correctPath = pathname.replace(`/${urlUserId}`, `/${user.id}`)
      const url = request.nextUrl.clone()
      url.pathname = correctPath
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
