import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import ScoreDetail from "@/app/[userId]/scores/[scoreId]/scoreDetail"
import { uploadPracticeRecord } from "@/app/actions/uploadPracticeRecord"
import styles from "../../practice.module.css"

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ userId: string; category: string; itemId: string }>
}) {
  const { userId, category, itemId } = await params

  const perfStart = performance.now()

  // URLのuserIdはSupabase UIDなので、Prisma内部IDに変換
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
  })
  if (!dbUser) return <div>ユーザーが見つかりません</div>
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
  if (item.ownerUserId && item.ownerUserId !== userId) {
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
  const [buildUrl, analysisData, performanceCount, latestPerf, recentPerfs] =
    await Promise.all([
      // buildUrl
      (async (): Promise<string | null> => {
        if (item.buildStatus === "done" && item.generatedXmlPath) {
          const { data } = await storageAdmin.storage
            .from("musicxml")
            .createSignedUrl(item.generatedXmlPath, 300)
          return data?.signedUrl ?? null
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
          if (data?.signedUrl) {
            const res = await fetch(data.signedUrl)
            if (res.ok) return res.json()
          }
        }
        return null
      })(),

      // Performance 件数
      prisma.practicePerformance.count({
        where: { userId: dbUser.id, practiceItemId: itemId },
      }),

      // 最新サマリー
      prisma.practicePerformance.findFirst({
        where: { userId: dbUser.id, practiceItemId: itemId },
        orderBy: { uploadedAt: "desc" },
        select: {
          id: true,
          pitchAccuracy: true,
          timingAccuracy: true,
          overallScore: true,
          analysisSummary: true,
        },
      }),

      // 練習履歴（最新5件）
      prisma.practicePerformance.findMany({
        where: { userId: dbUser.id, practiceItemId: itemId },
        orderBy: { uploadedAt: "desc" },
        take: 5,
        select: {
          id: true,
          uploadedAt: true,
          overallScore: true,
        },
      }),
    ])
  console.log(`[PERF] practice/item step3_parallel: ${(performance.now() - perfStep3).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const categoryLabels: Record<string, string> = {
    scale: "音階", scales: "音階",
    arpeggio: "アルペジオ", arpeggios: "アルペジオ",
    etude: "エチュード", etudes: "エチュード",
  }

  const infoPanel = (
    <div className={styles.infoPanel}>
      {/* カテゴリバッジ */}
      <span className={`${styles.infoPanelCategory} ${
        item.category === "scale" ? styles.infoPanelCategoryScale :
        item.category === "arpeggio" ? styles.infoPanelCategoryArpeggio :
        styles.infoPanelCategoryEtude
      }`}>
        {categoryLabels[item.category] || item.category}
      </span>

      {/* タイトル */}
      <div className={styles.infoPanelTitle}>{item.title}</div>

      {/* 作曲者 */}
      {item.composer && (
        <div className={styles.infoPanelComposer}>{item.composer}</div>
      )}


      <hr className={styles.infoPanelDivider} />

      {/* メタ情報 */}
      <div className={styles.infoPanelMeta}>
        <div className={styles.infoPanelMetaRow}>
          <span className={styles.infoPanelMetaLabel}>調</span>
          <span className={styles.infoPanelMetaValue}>
            {item.keyTonic} {item.keyMode === "major" ? "長調" : "短調"}
          </span>
        </div>
        {item.tempoMin && item.tempoMax && (
          <div className={styles.infoPanelMetaRow}>
            <span className={styles.infoPanelMetaLabel}>テンポ</span>
            <span className={styles.infoPanelMetaValue}>
              ♩= {item.tempoMin}-{item.tempoMax}
            </span>
          </div>
        )}
        {item.positions.length > 0 && (
          <div className={styles.infoPanelMetaRow}>
            <span className={styles.infoPanelMetaLabel}>ポジション</span>
            <span className={styles.infoPanelMetaValue}>
              {item.positions.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* 技法タグ */}
      {item.techniques.length > 0 && (
        <>
          <hr className={styles.infoPanelDivider} />
          <div className={styles.infoPanelTagSection}>
            <div className={styles.infoPanelTagLabel}>技法</div>
            {item.techniques.map(t => (
              <span key={t.techniqueTag.name}
                className={`${styles.infoPanelTag} ${
                  t.isPrimary ? styles.infoPanelTagPrimary : styles.infoPanelTagNormal
                }`}>
                {t.techniqueTag.name}
              </span>
            ))}
          </div>
        </>
      )}

      {/* 説明 */}
      {(item.description || item.descriptionShort) && (
        <>
          <hr className={styles.infoPanelDivider} />
          <div className={styles.infoPanelDescription}>
            {item.description || item.descriptionShort}
          </div>
        </>
      )}

      {/* 練習履歴 */}
      <hr className={styles.infoPanelDivider} />
      <div className={styles.infoPanelHistory}>
        <div className={styles.infoPanelTagLabel}>練習履歴</div>
        {recentPerfs.length === 0 && (
          <div className={styles.infoPanelEmpty}>まだ練習していません</div>
        )}
        {recentPerfs.map(p => (
          <div key={p.id} className={styles.infoPanelHistoryItem}>
            <span className={styles.infoPanelHistoryDate}>
              {new Date(p.uploadedAt).toLocaleDateString("ja-JP", {
                month: "numeric", day: "numeric"
              })}
            </span>
            <span className={styles.infoPanelHistoryScore}>
              {p.overallScore != null
                ? `${Math.round(p.overallScore)}点`
                : "解析中"
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* パンくず */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px 0" }}>
        <a href={`/${userId}/practice/${category}`}
           style={{ fontSize: 13, color: "#4a90d9", textDecoration: "none" }}>
          ← {categoryLabels[category] || category}
        </a>
      </div>

      <ScoreDetail
        score={{ id: item.id, title: item.title }}
        userId={userId}
        analysis={analysisData}
        uploadAction={uploadPracticeRecord}
        buildUrl={buildUrl}
        performanceCount={performanceCount}
        latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
        latestTimingAccuracy={latestPerf?.timingAccuracy ?? null}
        infoSlot={infoPanel}
        singleStaffLine={item.category === "scale" || item.category === "arpeggio"}
        practiceItemId={item.id}
      />
    </div>
  )
}
