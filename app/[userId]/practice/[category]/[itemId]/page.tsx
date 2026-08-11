import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import ScoreDetail from "@/app/[userId]/scores/[scoreId]/scoreDetail"
import { uploadPracticeRecord } from "@/app/actions/uploadPracticeRecord"
import { Music } from "lucide-react"
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
  searchParams,
}: {
  params: Promise<{ userId: string; category: string; itemId: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const { category, itemId } = p

  // 曲詳細から来た場合 (?from=scoreId) は「曲にもどる」導線を出す (2026-08-02 ループ動線)。
  // scoreId は本人がアクセスできる曲のみ有効化 (他人の非共有曲は無視)。
  const { from } = await searchParams
  let fromScore: { id: string; title: string } | null = null
  if (from && /^c[a-z0-9]{20,32}$/.test(from)) {
    try {
      const s = await prisma.score.findFirst({
        where: { id: from, deletedAt: null, OR: [{ createdById: dbUserId }, { isShared: true }] },
        select: { id: true, title: true },
      })
      if (s) fromScore = s
    } catch { fromScore = null }
  }

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

  if (!item) return <div>この教材は見つからなかったよ</div>

  // アクセス制御: 他ユーザーの個人アイテムは閲覧不可
  if (item.ownerUserId && item.ownerUserId !== dbUserId) {
    return <div>この教材はいま見られないよ</div>
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
            <p style={{ color: "var(--text-error)", marginTop: "1rem" }}>
              楽譜の準備がうまくいかなかったよ
            </p>
            {item.errorMessage && (
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--text-body)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.errorMessage}
              </pre>
            )}
            <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
              時間をおいて再度お試しください
            </p>
          </>
        ) : (
          <>
            <p style={{ marginTop: "1rem" }}>アルコが、楽譜を準備しているよ</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              自動で最新にするから、そのまま待っててね
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

  let favRow: { id: string } | null = null
  try {
    favRow = await prisma.favorite.findUnique({
      where: { userId_practiceItemId: { userId: dbUserId, practiceItemId: item.id } },
      select: { id: true },
    })
  } catch { favRow = null }

  // 先生の練習ポイント (2026-08-11 先生カルテv3)。migration未適用環境でも落ちないよう read防御
  let teacherNote: { point: string; teacherName: string } | null = null
  try {
    const n = await prisma.teacherMaterialNote.findFirst({
      where: { studentId: dbUserId, practiceItemId: item.id },
      orderBy: { updatedAt: "desc" },
      select: { point: true, teacher: { select: { name: true } } },
    })
    if (n) teacherNote = { point: n.point, teacherName: n.teacher.name }
  } catch { teacherNote = null }

  // 指板の実測塗り用 (2026-08-11): note_index → 弦/半音セル (skill_info由来)
  let fingerNotes: Record<number, { s: "G" | "D" | "A" | "E"; n: number }> = {}
  let songHeatmap = null as import("@/app/_libs/fingerboard/heatmapTypes").HeatmapData | null
  try {
    const { fetchSkillNotes, buildTargetHeatmap } = await import("@/app/_libs/fingerboard/aggregate")
    const [sk, hm] = await Promise.all([
      fetchSkillNotes("practice", item.id),
      buildTargetHeatmap(dbUserId, "practice", item.id, 20),
    ])
    fingerNotes = Object.fromEntries([...sk.entries()].map(([i, v]) => [i, { s: v.s, n: v.n, p: v.position }]))
    songHeatmap = hm
  } catch { fingerNotes = {}; songHeatmap = null }

  // 練習後カルテ (2026-08-11 Tetsuo確定): 教材にぶら下がる先生からのカルテ一覧 (read防御)
  let teacherKartes: { id: string; body: string; date: string; teacherName: string }[] = []
  try {
    const rows = await prisma.practiceKarte.findMany({
      where: { studentId: dbUserId, practiceItemId: item.id },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, body: true, createdAt: true, teacher: { select: { name: true } } },
    })
    teacherKartes = rows.map((k) => ({
      id: k.id, body: k.body,
      date: `${k.createdAt.getMonth() + 1}/${k.createdAt.getDate()}`,
      teacherName: k.teacher?.name ?? "先生",
    }))
  } catch { teacherKartes = [] }

  return (
    <div>
      {/* パンくず */}
      <div data-section="breadcrumb" style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px 0" }}>
        <a href={`/${authUserId}/practice/${category}`}
           style={{ fontSize: "var(--fs-body)", color: "var(--text-link)", textDecoration: "none" }}>
          ← {categoryLabels[category] || category}
        </a>
      </div>

      {/* 曲にもどる (曲詳細のおすすめ経由で来た場合のみ): 教材→曲の往復ループを切らない */}
      {fromScore && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 24px 0" }}>
          <a href={`/${authUserId}/scores/${fromScore.id}`}
             style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: "1px solid #dce7f5", borderRadius: 12, padding: "10px 14px", textDecoration: "none" }}>
            <Music size={15} color="#2563EB" aria-hidden style={{ flex: "none" }} />
            <span style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              練習がおわったら<b style={{ color: "var(--text-link)" }}>「{fromScore.title}」にもどる →</b>
            </span>
          </a>
        </div>
      )}

      {/* 先生の練習ポイント (宿題ではない・おすすめ教材への一言) */}
      {teacherNote && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 24px 0" }}>
          <div style={{ background: "#fdfaf2", border: "1px solid #eed9a0", borderRadius: 12, padding: "11px 14px" }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-master)" }}>
              {teacherNote.teacherName}先生の練習ポイント
            </div>
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.65, marginTop: 4, whiteSpace: "pre-wrap" }}>
              {teacherNote.point}
            </div>
          </div>
        </div>
      )}

      <ScoreDetail
        score={{ id: item.id, title: item.title }}
        userId={authUserId}
        analysis={analysisData}
        uploadAction={uploadPracticeRecord}
        buildUrl={buildUrl}
        performanceCount={performanceCount}
        latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
        singleStaffLine={item.category === "scale" || item.category === "arpeggio"}
        practiceItemId={item.id}
        initialFavorite={!!favRow}
        teacherKartes={teacherKartes}
        fingerNotes={fingerNotes}
        songHeatmap={songHeatmap}
      />
    </div>
  )
}
