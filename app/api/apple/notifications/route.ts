// App Store Server Notifications V2 の受け口 (2026-09-12 要件整理 v2.7 §2 S-1)。
// Apple が正・DB は写し。notificationUUID で冪等にし、生の JWS を AppleNotification に残す。
// 署名検証に失敗したものは保存せず 400。App Store Connect には本番と Sandbox の両方でこの URL を登録する。
import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { verifyAppleJws, applyTransaction, type AppleNotificationPayload, type AppleTransaction, type AppleRenewalInfo } from "@/app/_libs/apple/appleServer"

export const runtime = "nodejs"

export async function POST(request: Request) {
  let signedPayload: string | undefined
  try {
    const body = (await request.json()) as { signedPayload?: string }
    signedPayload = body.signedPayload
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 })
  }
  if (!signedPayload) return NextResponse.json({ error: "signedPayload required" }, { status: 400 })

  let payload: AppleNotificationPayload
  try {
    payload = await verifyAppleJws<AppleNotificationPayload>(signedPayload)
  } catch (e) {
    console.error("[apple/notifications] verify failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "invalid signature" }, { status: 400 })
  }

  // 冪等: 同じ notificationUUID は 2 回目以降 no-op
  const existing = await prisma.appleNotification.findUnique({ where: { notificationUUID: payload.notificationUUID }, select: { processedAt: true } })
  if (existing?.processedAt) return NextResponse.json({ ok: true, duplicate: true })

  let tx: AppleTransaction | null = null
  let renewal: AppleRenewalInfo | null = null
  let error: string | null = null
  try {
    if (payload.data?.signedTransactionInfo) tx = await verifyAppleJws<AppleTransaction>(payload.data.signedTransactionInfo)
    if (payload.data?.signedRenewalInfo) renewal = await verifyAppleJws<AppleRenewalInfo>(payload.data.signedRenewalInfo)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }

  await prisma.appleNotification.upsert({
    where: { notificationUUID: payload.notificationUUID },
    create: {
      notificationUUID: payload.notificationUUID,
      notificationType: payload.notificationType,
      subtype: payload.subtype ?? null,
      environment: payload.data?.environment ?? "Production",
      originalTransactionId: tx?.originalTransactionId ?? null,
      appAccountToken: tx?.appAccountToken ?? null,
      signedPayload,
      error,
    },
    update: { error },
  })
  if (error || !tx) return NextResponse.json({ error: error ?? "no transaction" }, { status: 400 })

  const r = await applyTransaction(tx, renewal)
  await prisma.appleNotification.update({
    where: { notificationUUID: payload.notificationUUID },
    data: { processedAt: new Date(), error: r.ok ? null : `not applied: ${r.reason}` },
  })
  // 持ち主が見つからない (appAccountToken 無し・未結び) でも Apple には 200 を返す。再送されても同じ結果になるため
  return NextResponse.json({ ok: true, applied: r.ok, reason: r.ok ? undefined : r.reason })
}
