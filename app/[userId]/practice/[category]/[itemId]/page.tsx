import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import ScoreDetail from "@/app/[userId]/scores/[scoreId]/scoreDetail"
import { uploadPracticeRecord } from "@/app/actions/uploadPracticeRecord"
import styles from "../../practice.module.css"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = await params
  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { title: true },
  })
  return { title: item?.title ?? "練習アイテム" }
}

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ userId: string; category: string; itemId: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const { category, itemId } = p

  const perfStart = performance.now()
  console.log(`[PERF] practice/item step1_dbUser: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const perfStep2 = performance.now()
  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    include: {
      techniques: {
        include: { techniqueTag: { select: { name: true } } },
      },
    },
  })
  console.log(`[PERF] practice/item step2_item: ${(performance.now() - perfStep2).toFixed(0)}ms`)

  if (!item) return <div>練習メニューが見つかりません</div>

  // アクセス制御: 他ユーザーの個人アイテムは閲覧不可
  if (item.ownerUserId && item.ownerUserId !== dbUserId) {
    return <div>このアイテムへのアクセス権がありません</div>
  }

  // 解析・ビルド未完了なら準備中 / エラー画面 (3 秒ごと自動更新)
  if (item.analysisStatus !== "done" || item.buildStatus !== "done") {
    const isError =
      item.analysisStatus === "error" || item.buildStatus === "error"
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        {!isError && <meta httpEquiv="refresh" content="3" />}
        <h2>{item.title}</h2>
        {isError ? (
          <>
            <p style={{ color: "#c00", marginTop: "1rem" }}>
              解析に失敗しました
            </p>
            {item.errorMessage && (
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "#666",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.errorMessage}
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
              解析: {item.analysisStatus} / 生成: {item.buildStatus}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#999" }}>
              3 秒ごとに自動更新します
            </p>
          </>
        )}
      </div>
    )
  }

  // =========================
  // item確定後の処理を並列化
  // =========================
  const perfStep3 = performance.now()
  const [buildUrl, analysisData, performanceCount, latestPerf] =
    await Promise.all([
      // buildUrl
      (async (): Promise<string | null> => {
        if (item.buildStatus === "done" && item.generatedXmlPath) {
          const { data } = await storageAdmin.storage
            .from("musicxml")
            .createSignedUrl(item.generatedXmlPath, 300)
          return encodeSignedUrl(data?.signedUrl)
        }
        return null
      })(),

      // analysisData
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (): Promise<any> => {
        if (item.analysisStatus === "done" && item.analysisPath) {
          const { data } = await storageAdmin.storage
            .from("musicxml")
            .createSignedUrl(item.analysisPath, 60)
          const url = encodeSignedUrl(data?.signedUrl)
          if (url) {
            const res = await fetch(url)
            if (res.ok) return res.json()
          }
        }
        return null
      })(),

      // Performance 件数
      prisma.practicePerformance.count({
        where: { userId: dbUserId, practiceItemId: itemId },
      }),

      // 最新サマリー
      prisma.practicePerformance.findFirst({
        where: { userId: dbUserId, practiceItemId: itemId },
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          pitchAccuracy: true,
          timingAccuracy: true,
          analysisSummary: true,
        },
      }),
    ])
  console.log(`[PERF] practice/item step3_parallel: ${(performance.now() - perfStep3).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const categoryLabels: Record<string, string> = {
    scale: "音階", scales: "音階",
    arpeggio: "アルペジオ", arpeggios: "アルペジオ",
    etude: "エチュード", etudes: "エチュード",
  }

  return (
    <div>
      {/* パンくず */}
      <div data-section="breadcrumb" style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px 0" }}>
        <a href={`/${authUserId}/practice/${category}`}
           style={{ fontSize: 13, color: "#4a90d9", textDecoration: "none" }}>
          ← {categoryLabels[category] || category}
        </a>
      </div>

      <ScoreDetail
        score={{ id: item.id, title: item.title }}
        userId={authUserId}
        analysis={analysisData}
        uploadAction={uploadPracticeRecord}
        buildUrl={buildUrl}
        performanceCount={performanceCount}
        latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
        latestTimingAccuracy={latestPerf?.timingAccuracy ?? null}
        singleStaffLine={item.category === "scale" || item.category === "arpeggio"}
        practiceItemId={item.id}
      />
    </div>
  )
}
