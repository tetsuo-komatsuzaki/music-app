// GET /api/plan/usage
//
// 課金 Phase 1 (2026-08-07) / 第4版で日次に改訂 (2026-09-12)。
// 自分の今日の採点クォータ。曲と基礎練は別枠。
// Recorder が「今日の採点 N/8」の表示に使う (無制限ユーザーには表示しない)。
// レスポンス: { unlimited, used, limit, practiceUsed, practiceLimit,
//              allowed, practiceAllowed, freeDaysLeft, freePeriodOver, plan }

import { NextResponse } from "next/server"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { getGradingQuota } from "@/app/_libs/plan"

export async function GET() {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const quota = await getGradingQuota(auth.user.dbUser.id)
  return NextResponse.json(quota)
}
