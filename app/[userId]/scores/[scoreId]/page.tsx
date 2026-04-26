import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import ScoreDetail from "./scoreDetail"
import AutoRefresh from "@/app/components/AutoRefresh"
import { uploadRecord } from "@/app/actions/uploadRecord"

export default async function Page({
  params
}: {
  params: Promise<{ userId: string; scoreId: string }>
}) {
  const { userId, scoreId } = await params

  const perfStart = performance.now()

  // dbUser と score を並列で取得
  // 修正1: findFirst を使用 (findUnique では where に deletedAt 等の非unique条件を入れられないため)
  const [dbUser, score] = await Promise.all([
    prisma.user.findUnique({ where: { supabaseUserId: userId } }),
    prisma.score.findFirst({ where: { id: scoreId, deletedAt: null } }),
  ])
  console.log(`[PERF] scores/detail step1_dbUser+score: ${(performance.now() - perfStart).toFixed(0)}ms`)

  if (!dbUser) return <div>ユーザーが見つかりません</div>
  if (!score) return <div>スコアが見つかりません</div>

  // アクセス制御
  if (score.createdById !== dbUser.id && !score.isShared) {
    return <div>このスコアへのアクセス権がありません</div>
  }

  // 解析・ビルド未完了なら準備中 / エラー画面 (3 秒ごとに RSC を再取得)
  if (score.analysisStatus !== "done" || score.buildStatus !== "done") {
    const isError =
      score.analysisStatus === "error" || score.buildStatus === "error"
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {!isError && <AutoRefresh intervalMs={3000} />}
        <h2>{score.title}</h2>
        {isError ? (
          <>
            <p style={{ color: "#c00", marginTop: "1rem" }}>
              解析に失敗しました
            </p>
            {score.errorMessage && (
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "#666",
                  whiteSpace: "pre-wrap",
                }}
              >
                {score.errorMessage}
              </pre>
            )}
            <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#999" }}>
              時間をおいて再度お試しください
            </p>
          </>
        ) : (
          <>
            <p style={{ marginTop: "1rem" }}>スコア準備中...</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
              解析: {score.analysisStatus} / 生成: {score.buildStatus}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#999" }}>
              3 秒ごとに自動更新します
            </p>
          </>
        )}
      </div>
    )
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
    // Path B 統一 (v3.3 spec): auth.uid() (= URL params の userId) ベースで参照
    (score.analysisStatus === "done")
      ? storageAdmin.storage
          .from("musicxml")
          .createSignedUrl(`${userId}/${score.id}/analysis.json`, 60)
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
