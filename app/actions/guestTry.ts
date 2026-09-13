"use server"

// ゲストの「登録なしで 1 回ためす」(2026-09-12 要件整理 v2.7 §2・§4)。
//
// 仕組み: 端末で Supabase の匿名ユーザーを作り (client 側 signInAnonymously)、その UUID で User 行 (role = guest) を作る。
// 以後は普通のログイン済みユーザーとして既存の録音経路 (getSignedUploadUrl → Storage → 解析器) を通す。
// 上限 (1 回・公式曲だけ・基礎練不可) は getGradingQuota が role = guest で判定する。
// 端末キー (guestDeviceKey) は unique。同じ端末で匿名ユーザーを作り直しても 2 回目は通さない。
// 30 日で Cron が User ごと消す (guestExpiresAt)。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { GUEST_RETENTION_DAYS } from "@/app/_libs/plan"

export type GuestTryState = {
  /** 匿名ユーザーが存在し User 行もあるか */
  ready: boolean
  /** 1 回を使い切ったか */
  used: boolean
  /** ためした曲 (結果を見に戻るため) */
  triedScoreId: string | null
  /** 直近の点数 (ゲストホームのカード用)。未解析なら null */
  lastScore: number | null
  /** 本人の URL の先頭 (/<uuid>) */
  authUserId: string | null
}

function isDeviceKey(k: string): boolean {
  return /^[A-Za-z0-9._:-]{8,128}$/.test(k)
}

/**
 * 匿名ユーザー (client で作成済み) に User 行を用意する。既にあれば何もしない。
 * 端末キーが別の匿名ユーザーで使用済みなら used: true を返し、行は作らない。
 */
export async function ensureGuestUser(deviceKey: string): Promise<GuestTryState & { error?: string }> {
  const empty: GuestTryState = { ready: false, used: false, triedScoreId: null, lastScore: null, authUserId: null }
  if (!isDeviceKey(deviceKey)) return { ...empty, error: "端末の識別子が不正です" }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...empty, error: "匿名の準備ができていません" }
  if (!user.is_anonymous) return { ...empty, error: "ログイン中のアカウントでは 1 回ためしは使えません" }

  const existing = await prisma.user.findUnique({ where: { supabaseUserId: user.id }, select: { id: true, role: true } })
  if (existing) return getGuestTryState()

  // 同じ端末で既に使っていないか (unique の前に読む。競合は unique で落ちる)
  const other = await prisma.user.findUnique({ where: { guestDeviceKey: deviceKey }, select: { id: true } })
  if (other) return { ...empty, used: true, authUserId: user.id }

  try {
    await prisma.user.create({
      data: {
        supabaseUserId: user.id,
        name: "ゲスト",
        role: "guest",
        plan: "free",
        guestDeviceKey: deviceKey,
        guestExpiresAt: new Date(Date.now() + GUEST_RETENTION_DAYS * 24 * 60 * 60 * 1000),
      },
    })
  } catch {
    return { ...empty, used: true, authUserId: user.id }
  }
  return getGuestTryState()
}

/** いまのセッションが匿名ゲストなら、その状態を返す。それ以外は ready: false */
export async function getGuestTryState(): Promise<GuestTryState> {
  const empty: GuestTryState = { ready: false, used: false, triedScoreId: null, lastScore: null, authUserId: null }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.is_anonymous) return empty
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id }, select: { id: true, role: true } })
  if (!dbUser || dbUser.role !== "guest") return { ...empty, authUserId: user.id }
  // queued は 15 分以内だけ「使用済み」に数える (getGradingQuota と同じ規則・CR-2-06)
  const perf = await prisma.performance.findFirst({
    where: {
      userId: dbUser.id,
      OR: [
        { analysisStatus: { in: ["processing", "done", "retrying"] } },
        { analysisStatus: "queued", createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
  })
  const lastScore = perf?.pitchAccuracy != null && perf?.timingAccuracy != null
    ? Math.round((perf.pitchAccuracy + perf.timingAccuracy) / 2)
    : null
  return { ready: true, used: perf != null, triedScoreId: perf?.scoreId ?? null, lastScore, authUserId: user.id }
}
