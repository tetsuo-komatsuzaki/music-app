// GET /api/plan/usage
//
// 課金 Phase 1 (2026-08-07): 自分の今週の採点クォータ。
// Recorder が「今週のAI採点 N/7」の表示に使う (無制限ユーザーには表示しない)。
// レスポンス: { unlimited, used, limit, allowed, plan }

import { NextResponse } from "next/server"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { getGradingQuota } from "@/app/_libs/plan"

export async function GET() {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const quota = await getGradingQuota(auth.user.dbUser.id)
  return NextResponse.json(quota)
}
