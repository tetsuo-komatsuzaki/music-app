// 生徒カルテ (2026-07-28)。概要(レッスン前ブリーフィング) + 宿題タブ。
// 担当していない生徒なら /teacher へ戻す。将来: 診断/添削タブをここに足す。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { getAchievementFlags } from "@/app/_libs/achievementFlags"
import { SUBTASK_BY_ID } from "@/app/_libs/subtaskCatalog.generated"
import { buildKarteData, buildRemarkTracking, buildNumbersRoom, type RemarkTrack, type NumbersRoomData } from "@/app/_libs/growthKarte"
import { buildUserHeatmap } from "@/app/_libs/fingerboard/aggregate"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import StudentKarte from "./StudentKarte"

// 演奏の analysisSummary.diagnosis から上位の弱点パターンを抽出 (§5-1: ミス集中箇所・原因候補)
type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
function topWeak(analysisSummary: unknown): WeakSlot[] {
  const dj = (analysisSummary as { diagnosis?: {
    map_available?: boolean
    per_subtask?: Record<string, { miss: number; target: number }>
    diagnosis?: { pitch?: string[]; rhythm?: string[] }
  } })?.diagnosis
  if (!dj || !dj.map_available) return []
  const out: WeakSlot[] = []
  for (const tree of ["pitch", "rhythm"] as const) {
    for (const sid of dj.diagnosis?.[tree] ?? []) {
      const def = SUBTASK_BY_ID[sid]
      if (!def || !def.diagnosable) continue
      const c = dj.per_subtask?.[sid] ?? { miss: 0, target: 0 }
      out.push({ name: def.name, tree: tree === "pitch" ? "音程" : "リズム", miss: c.miss, target: c.target })
    }
  }
  return out.slice(0, 3)
}

export const metadata = { title: "生徒カルテ" }

export default async function StudentKartePage({
  params, searchParams,
}: {
  params: Promise<{ userId: string; studentId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { userId, studentId } = await params
  const { tab: urlTab } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, role: true },
  })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  // 担当生徒であることを確認
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } },
    select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true, supabaseUserId: true } })
  if (!student) redirect(`/${userId}/teacher`)

  const since = new Date(Date.now() - 7 * 86400000)
  const [
    perfCount7d, pracCount7d, recentPerfs, recentAchievements,
    studentScoresRaw, studentItemsRaw, assignments,
  ] = await Promise.all([
    prisma.performance.count({ where: { userId: studentId, uploadedAt: { gte: since } } }),
    prisma.practicePerformance.count({ where: { userId: studentId, uploadedAt: { gte: since } } }),
    prisma.performance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 5,
      select: { pitchAccuracy: true, timingAccuracy: true, uploadedAt: true, score: { select: { title: true } } },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: studentId }, orderBy: { achievedAt: "desc" }, take: 3,
      select: { masteredAt: true, score: { select: { title: true } } },
    }),
    prisma.performance.findMany({
      where: { userId: studentId }, distinct: ["scoreId"], orderBy: { uploadedAt: "desc" }, take: 30,
      select: { scoreId: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: studentId }, distinct: ["practiceItemId"], orderBy: { uploadedAt: "desc" }, take: 30,
      select: { practiceItemId: true, practiceItem: { select: { title: true } } },
    }),
    prisma.assignment.findMany({
      where: { teacherId: me.id, studentId }, orderBy: { createdAt: "desc" }, take: 30,
      select: {
        id: true, scoreId: true, targetMeasures: true, reps: true, targetTempo: true, comment: true,
        dueDate: true, goalType: true, targetScore: true, moodTagId: true,
        doneAt: true, passedAt: true, submittedAt: true, submittedScore: true, submittedPerformanceId: true, createdAt: true,
        score: { select: { title: true, star: true } }, practiceItem: { select: { title: true, category: true, star: true } },
      },
    }),
  ])

  // 生徒→先生の旧メッセージ(自由チャット廃止・2026-08-09)は既読化だけしておく
  await prisma.message.updateMany({
    where: { teacherId: me.id, studentId, fromTeacher: false, readAt: null },
    data: { readAt: new Date() },
  })

  const recent5 = recentPerfs.map((p) => ({
    title: p.score?.title ?? "曲",
    avg: Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2),
    date: p.uploadedAt.toLocaleDateString("ja-JP"),
  }))
  const scoreTargets = studentScoresRaw
    .filter((s) => s.scoreId)
    .map((s) => ({ id: s.scoreId as string, title: s.score?.title ?? "曲" }))
  const itemTargets = studentItemsRaw
    .filter((s) => s.practiceItemId)
    .map((s) => ({ id: s.practiceItemId as string, title: s.practiceItem?.title ?? "教材" }))

  // 宿題で選べる全曲(共有ライブラリ+生徒の曲)と公開教材 — 最近取り組んでいなくても出せる
  const [allScoresRaw, allItemsRaw] = await Promise.all([
    prisma.score.findMany({
      where: { deletedAt: null, OR: [{ isShared: true }, { createdById: studentId }] },
      select: { id: true, title: true, star: true },
      orderBy: [{ star: "asc" }, { title: "asc" }],
    }),
    prisma.practiceItem.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, category: true, star: true },
      orderBy: [{ category: "asc" }, { star: "asc" }, { title: "asc" }],
    }),
  ])
  // 曲は難易度(★)ごと、教材はカテゴリごとに group 化してプルダウンを見やすくする
  const allScoreTargets = allScoresRaw.map((s) => ({
    id: s.id,
    title: s.title,
    group: s.star != null ? `★${s.star}` : "★未設定",
  }))
  const allItemTargets = allItemsRaw.map((s) => ({
    id: s.id,
    title: s.star != null ? `★${s.star} ${s.title}` : s.title,
    group: categoryLabel(s.category),
  }))

  // 宿題の「達成/マスター目標」自動判定用に、対象曲の達成状態をまとめて取得
  const achFlags = await getAchievementFlags(studentId, assignments.map((a) => a.scoreId))

  // 聴いてもらうリクエスト (2026-08-06): pending のみ・新しい順
  const listenReqRows = await prisma.listenRequest.findMany({
    where: { teacherId: me.id, studentId, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, scoreId: true, performanceId: true, createdAt: true },
  })
  const listenPerfs = listenReqRows.length
    ? await prisma.performance.findMany({
        where: { id: { in: listenReqRows.map((r) => r.performanceId) } },
        select: { id: true, pitchAccuracy: true, timingAccuracy: true, score: { select: { title: true } } },
      })
    : []
  const perfById = new Map(listenPerfs.map((pf) => [pf.id, pf]))
  const listenRequests = listenReqRows.map((r) => {
    const pf = perfById.get(r.performanceId)
    const avg = pf?.pitchAccuracy != null && pf?.timingAccuracy != null
      ? Math.round((pf.pitchAccuracy + pf.timingAccuracy) / 2) : null
    return {
      id: r.id, scoreId: r.scoreId, performanceId: r.performanceId,
      title: pf?.score.title ?? "演奏", avg,
      date: r.createdAt.toLocaleDateString("ja-JP"),
    }
  })

  // 先生の所見 (2026-08-02): 癖タグの記録履歴 (直近10件)
  let observations: { id: string; tagIds: string[]; severity: string | null; comment: string | null; date: string }[] = []
  // 表現の評価 (2026-08-03 Phase0-3): expr_* 行 (💪/🔥/🌿)
  let expressions: { id: string; tagId: string; severity: string | null; comment: string | null; date: string }[] = []
  try {
    const rows = await prisma.teacherObservation.findMany({
      where: { teacherId: me.id, studentId },
      orderBy: { createdAt: "desc" },
      take: 40, // 癖マップのタグ最新状態の網羅用 (履歴リスト表示は10件に絞る)
      select: { id: true, tagIds: true, severity: true, comment: true, createdAt: true },
    })
    // 表現評価 (expr_*) は癖の所見と分離して渡す (2026-08-03 Phase0-3)
    observations = rows
      .filter((o) => !o.tagIds.some((t) => t.startsWith("expr_")))
      .map((o) => ({
        id: o.id, tagIds: o.tagIds, severity: o.severity, comment: o.comment,
        date: o.createdAt.toLocaleDateString("ja-JP"),
      }))
    expressions = rows
      .filter((o) => o.tagIds.some((t) => t.startsWith("expr_")))
      .map((o) => ({
        id: o.id, tagId: o.tagIds[0], severity: o.severity, comment: o.comment,
        date: o.createdAt.toLocaleDateString("ja-JP"),
      }))
  } catch {
    observations = []
  }

  // 生徒の目標 (目標共有・2026-08-02): オンボの旅の地図(目標曲/時期/エピックウィン)を先生にも見せる
  let studentGoal: { songName: string; songStar: number | null; goalDate: string | null; epicWin: string | null } | null = null
  try {
    const onb = await prisma.onboardingProfile.findUnique({
      where: { userId: studentId },
      select: { answers: true },
    })
    const a = (onb?.answers ?? null) as { q4song?: string; q4star?: number; q8?: string; goalSong?: string | null; goalDate?: string | null } | null
    // オンボ完了に関わらず、目標曲が設定されていれば共有 (設定から後付け変更できるため)
    if (a?.q4song) {
      studentGoal = {
        songName: a.q4song,
        songStar: a.q4star ?? null,
        goalDate: a.goalDate ?? null,
        epicWin: a.goalSong || a.q8 || null,
      }
    }
  } catch {
    studentGoal = null
  }

  // ── 練習タブ (§5-1 拡充): 取り組んでいる曲/教材 + 直近の録音(分析結果 + 音声) ──
  // 曲ごとの横スライドに履歴が並ぶよう 36×2 まで取得 (2026-08-11 修正: 旧12件では曲別が1〜2枚でスライド不能だった)
  const [scorePerfs, pracPerfs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 36,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, rangeFromNote: true, analysisSummary: true, scoreId: true, score: { select: { title: true, star: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 36,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, analysisSummary: true, practiceItemId: true, practiceItem: { select: { title: true, category: true, star: true } } },
    }),
  ])
  const avg2 = (p: number | null, t: number | null) => Math.round(((p ?? 0) + (t ?? 0)) / 2)
  // 日付はロケール依存の toLocaleDateString を使わない (サーバlocale次第で「31.5.2026」式に崩れる)
  const fmtMD = (at: number) => { const d = new Date(at); return `${d.getMonth() + 1}/${d.getDate()}` }
  type RecRaw = { id: string; kind: "score" | "practice"; at: number; title: string; cat: string; star: number | null; pitch: number; timing: number; avg: number; weak: WeakSlot[]; targetId: string | null }
  const recRaw: RecRaw[] = [
    ...scorePerfs.map((p) => ({
      id: p.id, kind: "score" as const, at: p.uploadedAt.getTime(), title: p.score?.title ?? "曲",
      targetId: p.scoreId,
      cat: p.rangeFromNote != null ? "曲" : "曲", star: p.score?.star ?? null,
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      weak: topWeak(p.analysisSummary),
    })),
    ...pracPerfs.map((p) => ({
      id: p.id, kind: "practice" as const, at: p.uploadedAt.getTime(), title: p.practiceItem?.title ?? "教材",
      targetId: p.practiceItemId,
      cat: p.practiceItem?.category ? categoryLabel(p.practiceItem.category) : "基礎練", star: p.practiceItem?.star ?? null,
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      weak: topWeak(p.analysisSummary),
    })),
  ].sort((a, b) => b.at - a.at)

  // 音声は一覧では再生しない (詳細画面で署名URLを発行)。ここでの一括署名URL生成は廃止
  const recordings = recRaw.map((r) => ({
    id: r.id, kind: r.kind, title: r.title, cat: r.cat, star: r.star, pitch: r.pitch, timing: r.timing, avg: r.avg, weak: r.weak,
    targetId: r.targetId,
    date: fmtMD(r.at),
    audioUrl: null as string | null,
  }))

  // 練習後カルテ (2026-08-11 Tetsuo確定): 曲/教材にぶら下がる独立エンティティ。
  // 曲別タブで「書かれたカルテ一覧」を見せる (migration未適用でも落ちない read防御)
  let kartes: { id: string; targetId: string; kind: "score" | "practice"; title: string; cat: string; body: string; date: string; monthKey: string; monthLabel: string; read: boolean }[] = []
  try {
    const rows = await prisma.practiceKarte.findMany({
      where: { teacherId: me.id, studentId },
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, body: true, createdAt: true, readAt: true, scoreId: true, practiceItemId: true, score: { select: { title: true } }, practiceItem: { select: { title: true, category: true } } },
    })
    const nowYear = new Date().getFullYear()
    kartes = rows.map((k) => {
      const y = k.createdAt.getFullYear()
      const m = k.createdAt.getMonth() + 1
      return {
        id: k.id,
        targetId: (k.scoreId ?? k.practiceItemId)!,
        kind: k.scoreId ? ("score" as const) : ("practice" as const),
        title: k.score?.title ?? k.practiceItem?.title ?? "曲",
        cat: k.score ? "曲" : k.practiceItem?.category ? categoryLabel(k.practiceItem.category) : "教材",
        body: k.body,
        date: fmtMD(k.createdAt.getTime()),
        monthKey: `${y}-${String(m).padStart(2, "0")}`,
        monthLabel: y === nowYear ? `${m}月` : `${y}年${m}月`,
        read: k.readAt != null,
      }
    }).filter((k) => k.targetId)
  } catch { kartes = [] }

  // 取り組んでいる曲・教材 (直近2週間に練習したもの・点数で絞らず・重複除去)。
  // 上達状況表示用に 期間内の最古スコア(first)・枚数(count)・最新演奏へのリンク(perfId/kind) も持つ。
  const twoWeeksAgoMs = Date.now() - 14 * 864e5
  const rec2w = recRaw.filter((r) => r.at >= twoWeeksAgoMs)
  const workMap = new Map<string, { title: string; cat: string; kind: "score" | "practice"; avg: number; first: number; count: number; perfId: string; targetId: string | null }>()
  for (const r of rec2w) {
    const k = `${r.cat}:${r.title}`
    const e = workMap.get(k)
    if (!e) workMap.set(k, { title: r.title, cat: r.cat, kind: r.kind, avg: r.avg, first: r.avg, count: 1, perfId: r.id, targetId: r.targetId })
    else { e.first = r.avg; e.count++ } // recRawは新しい順 → 最後に見た値が期間内最古
  }
  const working = [...workMap.values()].slice(0, 10)

  // カルテタブ (2026-08-02): 生徒に見えているのと同じ成長カルテ(直近30日)を読み取り専用で先生にも
  let karte = null
  try {
    if (student?.supabaseUserId) karte = await buildKarteData(studentId, student.supabaseUserId, "30d")
  } catch { karte = null }

  // 指摘トラッキング (v3第2段③): 先生の癖記録が直ったかを成功率推移で判定
  let remarks: RemarkTrack[] = []
  try { remarks = await buildRemarkTracking(studentId) } catch { remarks = [] }

  // 強み・弱み (生徒側「記録の分析」と同じ土俵=音×成功率・直近2週間)。にがて順+とくい
  let numbers: NumbersRoomData | null = null
  try { numbers = await buildNumbersRoom(studentId, "14d") } catch { numbers = null }

  // 指板ヒートマップ (2026-08-11 Tetsuo確定): 診断レポートのにがて/とくい文章の代替。直近2週間
  let heatmap: HeatmapData = { cells: {}, details: {}, perfCount: 0 }
  try { heatmap = await buildUserHeatmap(studentId, 14) } catch { /* storage不通でも画面は出す */ }
  let fbMarks: { cellId: string; note: string }[] = []
  try {
    fbMarks = (await prisma.teacherMarkedCell.findMany({
      where: { teacherId: me.id, studentId },
      select: { cellId: true, note: true },
    })).map((m) => ({ cellId: m.cellId, note: m.note }))
  } catch { fbMarks = [] }

  // 合格の履歴 (2026-08-11): カテゴリ→★でまとめる共有ビュー用
  const mdP = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const passedItems = assignments
    .filter((a) => a.passedAt != null)
    .map((a) => ({
      title: a.score?.title ?? a.practiceItem?.title ?? "課題",
      cat: a.score ? "曲" : a.practiceItem?.category ? categoryLabel(a.practiceItem.category) : "その他",
      star: a.score?.star ?? a.practiceItem?.star ?? null,
      when: mdP(a.passedAt as Date),
      score: a.submittedScore,
    }))

  return (
    <StudentKarte
      initialTab={urlTab === "karte" || urlTab === "growth" || urlTab === "passed" ? urlTab : undefined}
      remarks={remarks}
      passedItems={passedItems}
      worstNotes={numbers?.worstNotes ?? []}
      bestNotes={numbers?.bestNotes ?? []}
      heatmap={heatmap}
      fbMarks={fbMarks}
      userId={userId}
      studentId={studentId}
      studentName={student.name}
      karte={karte}
      studentSupabaseUserId={student?.supabaseUserId ?? null}
      briefing={{
        practiceCount7d: perfCount7d + pracCount7d,
        recent5,
        achievements: recentAchievements.map((a) => ({
          title: a.score?.title ?? "曲",
          mastered: a.masteredAt != null,
        })),
        goal: studentGoal,
      }}
      observations={observations}
      expressions={expressions}
      scoreTargets={scoreTargets}
      itemTargets={itemTargets}
      allScoreTargets={allScoreTargets}
      allItemTargets={allItemTargets}
      working={working}
      recordings={recordings}
      kartes={kartes}
      listenRequests={listenRequests}
      assignments={assignments.map((a) => ({
        id: a.id,
        targetTitle: a.score?.title ?? a.practiceItem?.title ?? "課題",
        targetMeasures: a.targetMeasures,
        reps: a.reps,
        targetTempo: a.targetTempo,
        comment: a.comment,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        goalType: a.goalType,
        targetScore: a.targetScore,
        moodTagId: a.moodTagId,
        scoreId: a.scoreId,
        achieved: a.scoreId ? (achFlags.get(a.scoreId)?.achieved ?? false) : false,
        mastered: a.scoreId ? (achFlags.get(a.scoreId)?.mastered ?? false) : false,
        done: a.doneAt != null,
        passed: a.passedAt != null,
        submittedPerformanceId: a.submittedPerformanceId,
        submitted: a.submittedAt != null,
        submittedScore: a.submittedScore,
        createdAt: a.createdAt.toLocaleDateString("ja-JP"),
      }))}
    />
  )
}
