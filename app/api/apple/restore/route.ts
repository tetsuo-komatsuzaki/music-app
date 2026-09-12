// 購入を復元 (2026-09-12 要件整理 v2.7 §6 S-3)。
// アプリが StoreKit から取り直した現在の権利 (JWS の配列) を受け、originalTransactionId を照合する:
//   未結び → 結ぶ ／ この UUID に結び済み → 状態だけ更新 ／ 別のアカウントに結び済み → conflict (付け替えない) ／ 権利なし → none
import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { verifyAppleJws, applyTransaction, isKnownProduct, type AppleTransaction } from "@/app/_libs/apple/appleServer"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  let list: string[] = []
  try { list = ((await request.json()) as { jws?: string[] }).jws ?? [] } catch { /* below */ }
  if (list.length === 0) return NextResponse.json({ result: "none" })

  let conflict = false
  for (const jws of list) {
    let tx: AppleTransaction
    try { tx = await verifyAppleJws<AppleTransaction>(jws) } catch { continue }
    if (!isKnownProduct(tx.productId)) continue
    const r = await applyTransaction(tx, null, { forUserId: user.id })
    if (r.ok) return NextResponse.json({ result: "ok", status: r.status })
    if (r.reason === "conflict") conflict = true
  }
  return NextResponse.json({ result: conflict ? "conflict" : "none" }, { status: conflict ? 409 : 200 })
}
