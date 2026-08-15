// 上達のようすモーダル用: 本人のこの曲の評価済み演奏の推移データ (2026-08-16 #6)。
// GoalTracker (ホーム/曲詳細) から遅延取得される。最小フィールドのみ返す。
import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scoreId: string }> },
) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const { scoreId } = await params
  if (!isValidCuid(scoreId)) {
    return NextResponse.json({ error: "scoreId が不正です" }, { status: 400 })
  }

  const performances = await prisma.performance.findMany({
    where: { scoreId, userId: auth.user.dbUser.id, analysisStatus: "done" },
    orderBy: { uploadedAt: "asc" },
    select: {
      pitchAccuracy: true,
      timingAccuracy: true,
      uploadedAt: true,
      partId: true,
      rangeFromNote: true,
    },
  })

  return NextResponse.json({ performances })
}
