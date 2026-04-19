// app/_libs/authResponses.ts
//
// 認証応答の共通ヘルパー。
// middleware.ts と app/_libs/requireAuth.ts の両方から利用。
// prisma 等の重依存を持たないため、Edge runtime でも安全に動作する。

import { NextResponse } from "next/server"

/**
 * 認証失敗 (401 Unauthorized) の標準応答。
 *
 * - WWW-Authenticate: RFC 7235 準拠（Bearer 認証方式を宣言）
 * - Cache-Control: no-store: CDN 中間キャッシュを抑止（認証状態が他ユーザーに漏れないように）
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": "Bearer",
        "Cache-Control": "no-store",
      },
    }
  )
}
