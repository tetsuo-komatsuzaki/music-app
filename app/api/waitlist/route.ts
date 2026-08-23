// LPのウェイティングリスト登録 (2026-08-23)。
// 認証不要 (middleware の PUBLIC_API_PATHS に登録済み)。LPは同一ドメイン配信のためCORS不要。
// 重複は unique 制約で吸収し、既登録でも ok を返す (登録済みかどうかを外部に漏らさない)。
import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export const runtime = "nodejs"

// 素朴なレート制限 (インスタンス内メモリ ・ サーバレスでも単発の乱打は防げる)
const hits = new Map<string, { n: number; t: number }>()
const LIMIT = 8          // 10分あたり
const WINDOW_MS = 10 * 60 * 1000

function limited(ip: string): boolean {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > WINDOW_MS) {
    hits.set(ip, { n: 1, t: now })
    return false
  }
  h.n += 1
  return h.n > LIMIT
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim()
    if (limited(ip)) {
      return NextResponse.json({ ok: false, error: "too_many" }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const raw = typeof body?.email === "string" ? body.email : ""
    const email = raw.trim().toLowerCase()
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 })
    }

    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {},                       // 既登録は何もしない (登録日時を保持)
      create: { email, source: "lp" },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 })
  }
}
