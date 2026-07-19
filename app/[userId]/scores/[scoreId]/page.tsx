import { prisma } from "@/app/_libs/prisma"
import { badgeKind } from "@/app/_libs/starProgress"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import ScoreDetail from "./scoreDetail"
import AutoRefresh from "@/app/components/AutoRefresh"
import { uploadRecord } from "@/app/actions/uploadRecord"
import LessonGateBanner from "./LessonGateBanner"
import { getLessonInventory, getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { LESSON_BY_TAG } from "@/app/[userId]/lessons/_lib/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scoreId: string }>
}) {
  const { scoreId } = await params
  const score = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: { title: true },
  })
  return { title: score?.title ?? "楽曲" }
}

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
  const [buildUrl, analysisData, performanceCount, latestPerf, songMastery, scoreTags, lessonInventory, lessonState] = await Promise.all([
    // buildUrl
    (score.buildStatus === "done" && score.generatedXmlPath)
      ? storageAdmin.storage
          .from("musicxml")
          .createSignedUrl(score.generatedXmlPath, 300)
          .then(r => encodeSignedUrl(r.data?.signedUrl))
      : Promise.resolve(null),

    // analysis（signedUrl + fetch を1チェーンで）
    // analysis.json は Python (analyze_musicxml.py) が書き込む。
    // Python は USER_ID (dbUser.id, sys.argv[1]) で path を組み立てるため OLD path のまま。
    // Commit 5 (Python STORAGE_USER_ID 化) + Commit 7 (既存ファイル移行) 完了後に
    // ここを ${userId} (auth.uid()) に変更する想定 (v3.4 spec で明記)。
    (score.analysisStatus === "done")
      ? storageAdmin.storage
          .from("musicxml")
          .createSignedUrl(`${score.createdById}/${score.id}/analysis.json`, 60)
          .then(r => {
            const u = encodeSignedUrl(r.data?.signedUrl)
            return u ? fetch(u) : null
          })
          .then(res => res?.ok ? res.json() : null)
          .catch(() => null)
      : Promise.resolve(null),

    // performanceCount
    prisma.performance.count({
      where: { userId: dbUser.id, scoreId },
    }),

    // latestPerf (区間録音=部分練習は公式指標に非算入 → rangeFromNote: null)
    prisma.performance.findFirst({
      where: { userId: dbUser.id, scoreId, rangeFromNote: null },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        pitchAccuracy: true,
        timingAccuracy: true,
        analysisSummary: true,
      },
    }),

    // C-6b: タイトル横バッジは新達成記録 (マスター≻達成) から
    prisma.userScoreAchievement.findUnique({
      where: { userId_scoreId: { userId: dbUser.id, scoreId } },
      select: { achievedAt: true, masteredAt: true },
    }),

    // 学びレッスン誘導 (フロー【1】確定#5/#6): 曲のタグ・レッスン在庫・ユーザー状態
    prisma.score.findUnique({
      where: { id: scoreId },
      select: {
        scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
        featureTags: {
          select: {
            featureTag: { select: { category: true, name: true, isAcquisition: true } },
          },
        },
      },
    }),
    getLessonInventory(),
    getUserLessonState(dbUser.id),
  ])

  // ── 学びレッスン誘導: 曲のタグのうち「公開中レッスンがあり、未習得
  //    (クリアも自己申告もない=ユニオン外)」のものを案内 (achievement.py要件①と同一式) ──
  const gateTags: Array<{ tagType: string; tagKey: string }> = []
  for (const t of scoreTags?.scoreTechniqueTags ?? []) {
    gateTags.push({ tagType: "technique", tagKey: t.techniqueTag.name })
  }
  for (const f of scoreTags?.featureTags ?? []) {
    if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition) {
      gateTags.push({ tagType: "double_stop", tagKey: f.featureTag.name })
    }
  }
  const gatePosKeys = new Set<string>()
  for (const n of score.positions) {
    if (n >= 2) gatePosKeys.add(n >= 6 ? "6" : String(n)) // 6以上は"6"に正規化 (確定#8)
  }
  for (const key of gatePosKeys) gateTags.push({ tagType: "position", tagKey: key })

  const pendingLessons = gateTags
    .filter((t) => {
      const id = tagId(t)
      const item = lessonInventory.get(id)
      return (
        !!item &&
        item.buildStatus === "done" &&
        !!item.generatedXmlPath &&
        !lessonState.union.has(id)
      )
    })
    .map((t) => LESSON_BY_TAG.get(tagId(t)))
    .filter((l): l is NonNullable<typeof l> => !!l)
  console.log(`[PERF] scores/detail step2_parallel: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  return (
    <>
      {pendingLessons.length > 0 && (
        <LessonGateBanner
          userId={userId}
          scoreId={scoreId}
          lessons={pendingLessons.map((l) => ({ id: l.id, name: l.name }))}
        />
      )}
      <ScoreDetail
        score={{
          id: score.id,
          title: score.title,
          badge: badgeKind(songMastery),
        }}
        userId={userId}
        analysis={analysisData}
        uploadAction={uploadRecord}
        buildUrl={buildUrl}
        performanceCount={performanceCount}
        latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
        latestTimingAccuracy={latestPerf?.timingAccuracy ?? null}
      />
    </>
  )
}
