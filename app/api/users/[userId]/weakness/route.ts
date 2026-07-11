// GET /api/users/[userId]/weakness
//
// 工程C-6a (2026-07-11) — 累積の弱点（窓②）+ 弱点練習推薦。ホームの弱点表示用。
// UserSkillSubScore の217系カウンタをミス率順（対象>=10で足切り）で木ごとtop-2にし、
// ユーザーのstar帯（演奏実績曲の最高star）に合う教材を添える。
// スロットの形は /api/performances/[id]/diagnosis と同一（表示コンポーネント共用）。

import { NextRequest, NextResponse } from "next/server"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { recommendCumulative } from "@/app/_libs/weaknessRecommendation"
import { toSlotViews } from "@/app/_libs/diagnosisPresentation"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: urlUserId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  if (urlUserId !== auth.user.supabaseUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const dbUserId = auth.user.dbUser.id

  const recSlots = await recommendCumulative(dbUserId)
  return NextResponse.json({ slots: toSlotViews(recSlots) })
}
