// ゲストの 1 回ためしの定期削除 (2026-09-12 要件整理 v2.7 §4 D-10)。
// guestExpiresAt を過ぎた匿名ユーザー (role = guest) を、Performance (cascade)・Storage の音声・Supabase Auth ごと消す。
// Vercel Cron が毎日 JST 3:00 に呼ぶ (vercel.json)。Authorization: Bearer CRON_SECRET で保護。
import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { supabaseAdmin } from "@/app/_libs/supabaseAdmin"

export const runtime = "nodejs"

async function removeStorageFolder(bucket: string, prefix: string): Promise<void> {
  const { data } = await storageAdmin.storage.from(bucket).list(prefix, { limit: 1000 })
  if (!data || data.length === 0) return
  const files: string[] = []
  for (const entry of data) {
    if (entry.id) files.push(`${prefix}/${entry.name}`)
    else await removeStorageFolder(bucket, `${prefix}/${entry.name}`) // サブフォルダ
  }
  if (files.length) await storageAdmin.storage.from(bucket).remove(files)
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? ""
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const expired = await prisma.user.findMany({
    // 安全網 (CR-1-17): 何かの手違いで契約が付いた行 (昇格に失敗したまま購入が通った等) は消さない
    where: { role: "guest", guestExpiresAt: { lt: new Date() }, billingProvider: null, plan: "free" },
    select: { id: true, supabaseUserId: true },
    take: 200,
  })
  let removed = 0
  for (const u of expired) {
    try {
      await removeStorageFolder("performances", u.supabaseUserId)
      await prisma.user.delete({ where: { id: u.id } })
      await supabaseAdmin.auth.admin.deleteUser(u.supabaseUserId)
      removed++
    } catch (e) {
      console.error("[cron/guest-cleanup] failed:", u.id, e instanceof Error ? e.message : e)
    }
  }
  return NextResponse.json({ ok: true, candidates: expired.length, removed })
}
