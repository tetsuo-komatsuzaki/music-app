import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  // セッションをリフレッシュ
  const { data: { user } } = await supabase.auth.getUser()

  // ユーザー専用ページへのアクセス制御
  const pathname = request.nextUrl.pathname
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
