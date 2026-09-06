import { prisma } from "@/app/_libs/prisma"
import GuestGate from "@/app/components/guest/GuestGate"
import { GATE_TEXT } from "@/app/components/guest/gateText"
import { GUEST_DB_PLACEHOLDER, GUEST_ID } from "@/app/_libs/viewer"
import { badgeKind } from "@/app/_libs/starProgress"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import ScoreDetail from "./scoreDetail"
import ScoreVariantSwitcher, { type VariantEntry } from "./ScoreVariantSwitcher"
import ScoreTeacherBanner from "./ScoreTeacherBanner"
import AutoRefresh from "@/app/components/AutoRefresh"
import { uploadRecord } from "@/app/actions/uploadRecord"
import LessonGateBanner from "./LessonGateBanner"
import { getLessonInventory, getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { LESSON_BY_TAG } from "@/app/[userId]/lessons/_lib/content"
import { parseParts } from "@/app/_libs/materialParts"

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
  // ゲスト閲覧 (2026-09-06): 共有曲の詳細を、本人の記録なし (存在しない ID) で描き、上にゲートを重ねる
  const guest = userId === GUEST_ID
  const [dbUser, score] = await Promise.all([
    guest ? Promise.resolve({ id: GUEST_DB_PLACEHOLDER }) : prisma.user.findUnique({ where: { supabaseUserId: userId } }),
    prisma.score.findFirst({ where: { id: scoreId, deletedAt: null } }),
  ])
  console.log(`[PERF] scores/detail step1_dbUser+score: ${(performance.now() - perfStart).toFixed(0)}ms`)

  if (!dbUser) return <div>きみの情報が見つからなかったよ</div>
  if (!score) return <div>この曲は見つからなかったよ</div>

  // 登録済み・未ログインの人が「前回の画面」から自分の曲を開いたときもここに来る (2026-09-06)。
  // 中身は出さず、ゲートだけ出す (ログイン後は returnTo で本人の曲ページへ戻る)
  if (guest && !score.isShared) {
    const g = GATE_TEXT.generic
    return (
      <GuestGate title={g.title} items={g.items}>
        <div style={{ minHeight: "60vh" }} />
      </GuestGate>
    )
  }
  // アクセス制御
  if (score.createdById !== dbUser.id && !score.isShared) {
    return <div>この曲はいま見られないよ</div>
  }

  // ランク出し分け用 (2026-08-10): ★4+(中級者以上) では記号ガイドの基礎読譜記号を省く
  const starProgress = await prisma.userStarProgress.findUnique({
    where: { userId: dbUser.id },
    select: { currentStar: true },
  })
  const currentStar = starProgress?.currentStar ?? 1

  // パート分け (2026-07-26): パートは曲(グループ)単位に保存されている。
  const groupParts = score.groupId
    ? parseParts(
        (
          await prisma.materialGroup.findUnique({
            where: { id: score.groupId },
            select: { parts: true },
          })
        )?.parts,
      )
    : []

  // 難易度・パート変種の切り替え (2026-08-24 アップロード改修 Step4)。
  // 同グループの buildStatus=done の変種を集める (共有曲のみ ・ 自作曲は自分のもののみ)。
  let variantEntries: VariantEntry[] = []
  if (score.groupId) {
    try {
      const siblings = await prisma.score.findMany({
        where: {
          groupId: score.groupId, deletedAt: null, buildStatus: "done",
          OR: [{ isShared: true }, { createdById: dbUser.id }],
        },
        select: { id: true, difficulty: true, partId: true, star: true },
        orderBy: [{ difficulty: "asc" }, { createdAt: "asc" }],
      })
      const partName = (pid: string | null) =>
        pid ? (groupParts.find((p) => p.id === pid)?.name ?? "パート") : null
      variantEntries = siblings.map((v) => ({
        id: v.id, difficulty: v.difficulty, partId: v.partId,
        partName: partName(v.partId), star: v.star,
      }))
      // 自分自身が未完了などで一覧に居なければセレクタは出さない
      if (!variantEntries.some((v) => v.id === score.id)) variantEntries = []
    } catch { variantEntries = [] }
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
            <p style={{ color: "var(--text-error)", marginTop: "1rem" }}>
              楽譜の準備がうまくいかなかったよ
            </p>
            {score.errorMessage && (
              <pre
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--text-body)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {score.errorMessage}
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

  let favRow: { id: string } | null = null
  try {
    favRow = await prisma.favorite.findUnique({
      where: { userId_scoreId: { userId: dbUser.id, scoreId: score.id } },
      select: { id: true },
    })
  } catch { favRow = null }

  // 指板の実測塗り用 (2026-08-11): note_index → 弦/半音セル (skill_info由来・失敗しても画面は出す)
  let fingerNotes: Record<number, { s: "G" | "D" | "A" | "E"; n: number }> = {}
  // ふりかえりタブ用: この曲の全演奏合算の音程マップ (直近20演奏)
  let songHeatmap = null as import("@/app/_libs/fingerboard/heatmapTypes").HeatmapData | null
  try {
    const { fetchSkillNotes, buildTargetHeatmap } = await import("@/app/_libs/fingerboard/aggregate")
    const [sk, hm] = await Promise.all([
      fetchSkillNotes("score", score.id),
      buildTargetHeatmap(dbUser.id, "score", score.id, 10),
    ])
    fingerNotes = Object.fromEntries([...sk.entries()].map(([i, v]) => [i, { s: v.s, n: v.n, p: v.position }]))
    songHeatmap = hm
  } catch { fingerNotes = {}; songHeatmap = null }

  // 練習後カルテ (2026-08-11 案A): カルテごとに「一緒に送られた癖・旗・表現」をセットで表示 (read防御)
  let teacherKartes: import("@/app/components/StudentKarteCards").StudentKarteCard[] = []
  try {
    const rows = await prisma.practiceKarte.findMany({
      where: { studentId: dbUser.id, scoreId: score.id },
      orderBy: { createdAt: "desc" }, take: 50,
      select: { id: true, body: true, createdAt: true, context: true, readAt: true, teacher: { select: { name: true } } },
    })
    const ids = rows.map((k) => k.id)
    const [obsRows, markRows, exprRows] = ids.length
      ? await Promise.all([
        prisma.teacherObservation.findMany({ where: { studentId: dbUser.id, karteId: { in: ids } }, select: { karteId: true, tagIds: true, skillIds: true } }).catch(() => []),
        prisma.teacherMarkedCell.findMany({ where: { studentId: dbUser.id, karteId: { in: ids } }, select: { karteId: true, cellId: true, note: true } }).catch(() => []),
        prisma.userExpressionClear.findMany({ where: { userId: dbUser.id, karteId: { in: ids } }, select: { karteId: true, moodTagId: true, starAtClear: true } }).catch(() => []),
      ])
      : [[], [], []]
    const { SKILL_ID_LABELS, FEATURE_ID_LABELS } = await import("@/app/_libs/skillCatalog")
    const { resolveObsTag } = await import("@/app/_libs/observationCatalog")
    const { moodTagLabel } = await import("@/app/_libs/moodTags")
    const skillLabel = (id: string) => SKILL_ID_LABELS.find((x) => x.id === id)?.label ?? FEATURE_ID_LABELS[id] ?? null
    teacherKartes = rows.map((k) => ({
      id: k.id, body: k.body,
      date: `${k.createdAt.getMonth() + 1}/${k.createdAt.getDate()}`,
      teacherName: k.teacher?.name ?? "先生",
      context: (k.context === "lesson" || k.context === "audio" ? k.context : null) as "lesson" | "audio" | null,
      read: k.readAt != null,
      kuse: obsRows.filter((o) => o.karteId === k.id).map((o) => ({
        targets: (o.skillIds ?? []).map(skillLabel).filter((x): x is string => !!x),
        tags: o.tagIds.map((t) => resolveObsTag(t)?.label).filter((x): x is string => !!x),
      })),
      marks: markRows.filter((m) => m.karteId === k.id).map((m) => ({ cellId: m.cellId, note: m.note })),
      exprs: exprRows.filter((e) => e.karteId === k.id).map((e) => ({ label: moodTagLabel(e.moodTagId), star: e.starAtClear })),
    }))
  } catch { teacherKartes = [] }

  if (guest) {
    const g = GATE_TEXT.song(score.title)
    return (
      <GuestGate title={g.title} items={g.items}>
        <ScoreDetail
          score={{ id: score.id, title: score.title, badge: null }}
          userId={userId}
          rewardLit={false}
          analysis={analysisData}
          uploadAction={uploadRecord}
          parts={groupParts}
          buildUrl={buildUrl}
          performanceCount={0}
          latestPitchAccuracy={null}
          currentStar={1}
          initialFavorite={false}
          teacherKartes={[]}
          fingerNotes={fingerNotes}
          songHeatmap={null}
        />
      </GuestGate>
    )
  }
  return (
    <>
      {pendingLessons.length > 0 && (
        <LessonGateBanner
          userId={userId}
          scoreId={scoreId}
          lessons={pendingLessons.map((l) => ({ id: l.id, name: l.name }))}
        />
      )}
      <ScoreTeacherBanner scoreId={scoreId} userId={userId} />
      <ScoreVariantSwitcher userId={userId} currentId={score.id} variants={variantEntries} />
      <ScoreDetail
        score={{
          id: score.id,
          title: score.title,
          badge: badgeKind(songMastery),
        }}
        userId={userId}
        rewardLit={process.env.REWARD_SYSTEM_LIT === "1"}
        analysis={analysisData}
        uploadAction={uploadRecord}
        parts={groupParts}
        buildUrl={buildUrl}
        performanceCount={performanceCount}
        latestPitchAccuracy={latestPerf?.pitchAccuracy ?? null}
        currentStar={currentStar}
        initialFavorite={!!favRow}
        teacherKartes={teacherKartes}
        fingerNotes={fingerNotes}
        songHeatmap={songHeatmap}
      />
    </>
  )
}
