import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> }
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { comparisonResultPath: true, userId: true },
  })

  // エンティティ列挙防止: 存在しない or 他者所有 → 404
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!perf.comparisonResultPath) {
    return NextResponse.json({ results: null })
  }

  try {
    const { data } = await storageAdmin.storage
      .from("performances")
      .createSignedUrl(perf.comparisonResultPath, 60)

    if (!data?.signedUrl) return NextResponse.json({ results: null })

    const res = await fetch(data.signedUrl)
    if (!res.ok) return NextResponse.json({ results: null })

    const json = await res.json()
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ results: null })
  }
}
