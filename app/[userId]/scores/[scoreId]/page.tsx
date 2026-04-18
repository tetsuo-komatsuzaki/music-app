import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import ScoreDetail from "./scoreDetail"
import { uploadRecord } from "@/app/actions/uploadRecord"

export default async function Page({
  params
}: {
  params: Promise<{ userId: string; scoreId: string }>
}) {
  const { userId, scoreId } = await params

  const perfStart = performance.now()

  // dbUser と score を並列で取得
  const [dbUser, score] = await Promise.all([
    prisma.user.findUnique({ where: { supabaseUserId: userId } }),
    prisma.score.findUnique({ where: { id: scoreId } }),
  ])
  console.log(`[PERF] scores/detail step1_dbUser+score: ${(performance.now() - perfStart).toFixed(0)}ms`)

  if (!dbUser) return <div>ユーザーが見つかりません</div>
  if (!score) return <div>スコアが見つかりません</div>

  // アクセス制御
  if (score.createdById !== dbUser.id && !score.isShared) {
    return <div>このスコアへのアクセス権がありません</div>
  }

  // 残り全て並列実行
  const perfStep2 = performance.now()
  const [buildUrl, analysisData, performanceCount, latestPerf] = await Promise.all([
    // buildUrl
    (score.buildStatus === "done" && score.generatedXmlPath)
      ? storageAdmin.storage
          .from("musicxml")
          .createSignedUrl(score.generatedXmlPath, 300)
          .then(r => r.data?.signedUrl ?? null)
      : Promise.resolve(null),

    // analysis（signedUrl + fetch を1チェーンで）
    (score.analysisStatus === "done")
      ? storageAdmin.storage
          .from("musicxml")
          .createSignedUrl(`${score.createdById}/${score.id}/analysis.json`, 60)
          .then(r => r.data?.signedUrl ? fetch(r.data.signedUrl) : null)
          .then(res => res?.ok ? res.json() : null)
          .catch(() => null)
      : Promise.resolve(null),

    // performanceCount
    prisma.performance.count({
      where: { userId: dbUser.id, scoreId },
    }),

    // latestPerf
    prisma.performance.findFirst({
      where: { userId: dbUser.id, scoreId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        pitchAccuracy: true,
        timingAccuracy: true,
        overallScore: true,
        analysisSummary: true,
      },
    }),
  ])
  console.log(`[PERF] scores/detail step2_parallel: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  return (
    <ScoreDetail
      score={{
        id: score.id,
        title: score.title,
      }}
      userId={userId}
      analysis={analysisData}
      uploadAction={uploadRecord}
      buildUrl={buildUrl}
      performanceCount={performanceCount}
      latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
      latestTimingAccuracy={latestPerf?.timingAccuracy ?? null}
    />
  )
}
