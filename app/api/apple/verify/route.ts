// アプリからの購入証明 (2026-09-12 要件整理 v2.7 §6 S-2)。
// 購入シート確定の直後に StoreKit 2 の JWS を送ってもらい、通知を待たずに即反映する。
// 通知が後から来ても notificationUUID で冪等なので二重にならない。
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { verifyAppleJws, applyTransaction, type AppleTransaction } from "@/app/_libs/apple/appleServer"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let jws: string | undefined
  try { jws = ((await request.json()) as { jws?: string }).jws } catch { /* below */ }
  if (!jws) return NextResponse.json({ error: "jws required" }, { status: 400 })

  let tx: AppleTransaction
  try {
    tx = await verifyAppleJws<AppleTransaction>(jws)
  } catch (e) {
    return NextResponse.json({ error: "invalid", detail: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
  // 購入時に添えた appAccountToken は本人の UUID のはず。違えば他人の証明なので受けない
  if (tx.appAccountToken && tx.appAccountToken !== user.id) return NextResponse.json({ error: "token mismatch" }, { status: 403 })

  const r = await applyTransaction(tx, null, { forUserId: user.id })
  if (!r.ok) {
    const status = r.reason === "conflict" ? 409 : 400
    return NextResponse.json({ error: r.reason }, { status })
  }
  return NextResponse.json({ ok: true, status: r.status })
}
