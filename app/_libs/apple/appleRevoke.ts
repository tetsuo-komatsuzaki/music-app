import "server-only"
// Sign in with Apple のトークン失効 (審査 5.1.1(v): アカウント削除時に必須)。
// Supabase の OAuth 経由なので、サインイン時に受け取った provider_refresh_token を User.appleRefreshToken に持ち、
// 退会時に Apple の /auth/revoke へ送る。client_secret は Apple の秘密鍵 (ES256) で作る JWT。
// 鍵の env が無い間は何もしない (best effort・退会自体は止めない)。
import { SignJWT, importPKCS8 } from "jose"

const TOKEN_URL = "https://appleid.apple.com/auth/revoke"

export function appleRevokeConfigured(): boolean {
  return !!(process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY && process.env.APPLE_SERVICES_ID)
}

async function clientSecret(): Promise<string> {
  const key = await importPKCS8(process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"), "ES256")
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID! })
    .setIssuer(process.env.APPLE_TEAM_ID!)
    .setIssuedAt()
    .setExpirationTime("10m")
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_SERVICES_ID!)
    .sign(key)
}

/** 失効に成功したら true。設定が無い・トークンが無い・Apple が拒否したら false (呼び手は退会を続ける) */
export async function revokeAppleToken(refreshToken: string | null | undefined): Promise<boolean> {
  if (!refreshToken || !appleRevokeConfigured()) return false
  try {
    const body = new URLSearchParams({
      client_id: process.env.APPLE_SERVICES_ID!,
      client_secret: await clientSecret(),
      token: refreshToken,
      token_type_hint: "refresh_token",
    })
    const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })
    return res.ok
  } catch (e) {
    console.error("[appleRevoke] failed:", e instanceof Error ? e.message : e)
    return false
  }
}
