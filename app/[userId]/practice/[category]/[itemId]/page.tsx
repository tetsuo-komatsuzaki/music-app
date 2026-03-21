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

  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    include: {
      techniques: {
        include: { techniqueTag: { select: { name: true } } },
      },
    },
  })

  if (!item) return <div>練習メニューが見つかりません</div>

  // アクセス制御: 他ユーザーの個人アイテムは閲覧不可
  if (item.ownerUserId && item.ownerUserId !== userId) {
    return <div>このアイテムへのアクセス権がありません</div>
  }

  // =========================
  // buildUrl
  // =========================
  let buildUrl: string | null = null
  if (item.buildStatus === "done" && item.generatedXmlPath) {
    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(item.generatedXmlPath, 300)
    buildUrl = data?.signedUrl ?? null
  }

  // =========================
  // analysis
  // =========================
  let analysisData = null
  if (item.analysisStatus === "done" && item.analysisPath) {
    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(item.analysisPath, 60)
    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl)
      if (res.ok) analysisData = await res.json()
    }
  }

  // =========================
  // performances
  // =========================
  const practicePerformances = await prisma.practicePerformance.findMany({
    where: { userId, practiceItemId: itemId },
    orderBy: { uploadedAt: "desc" },
  })

  const performances = await Promise.all(
    practicePerformances.map(async (p) => {
      const { data: audioData } = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(p.audioPath, 60)

      let comparisonResult = null
      let comparisonWarnings: string[] = []
      if (p.comparisonResultPath) {
        const { data: compData } = await storageAdmin.storage
          .from("performances")
          .createSignedUrl(p.comparisonResultPath, 60)

        if (compData?.signedUrl) {
          try {
            const res = await fetch(compData.signedUrl)
            if (res.ok) {
              const json = await res.json()
              if (json.version && json.results) {
                comparisonResult = json.results
                comparisonWarnings = json.warnings || []
              } else if (Array.isArray(json)) {
                comparisonResult = json
              }
            }
          } catch (_e) { /* ignore */ }
        }
      }

      return {
        id: p.id,
        uploadedAt: p.uploadedAt.toISOString(),
        status: "uploaded",
        audioUrl: audioData?.signedUrl ?? null,
        comparisonResult,
        comparisonWarnings,
      }
    })
  )

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

      {/* 難易度 */}
      <div className={styles.infoPanelStars}>
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i > item.difficulty ? styles.infoPanelStarEmpty : undefined}>
            ★
          </span>
        ))}
      </div>

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
        {performances.length === 0 && (
          <div className={styles.infoPanelEmpty}>まだ練習していません</div>
        )}
        {performances.slice(0, 5).map(p => (
          <div key={p.id} className={styles.infoPanelHistoryItem}>
            <span className={styles.infoPanelHistoryDate}>
              {new Date(p.uploadedAt).toLocaleDateString("ja-JP", {
                month: "numeric", day: "numeric"
              })}
            </span>
            <span className={styles.infoPanelHistoryScore}>
              {p.comparisonResult
                ? (() => {
                    const evaluated = p.comparisonResult.filter(
                      (n: any) => n.evaluation_status === "evaluated" || n.evaluation_status === "pitch_only"
                    )
                    if (evaluated.length === 0) return "解析中"
                    const ok = evaluated.filter((n: any) => n.pitch_ok === true).length
                    return `${Math.round((ok / evaluated.length) * 100)}%`
                  })()
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
        performances={performances}
        analysis={analysisData}
        uploadAction={uploadPracticeRecord}
        buildUrl={buildUrl}
        infoSlot={infoPanel}
        singleStaffLine={item.category === "scale" || item.category === "arpeggio"}
      />
    </div>
  )
}
