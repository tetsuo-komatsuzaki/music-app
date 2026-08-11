"use server"

// 先生ユーザー機能 MVP のサーバーアクション (2026-07-28)。
// - 招待コード発行(先生) / コードで紐付け(生徒) / 宿題作成(先生) / 宿題完了(生徒)。
// 権限は requireAuthAction + role/リンク存在チェックで担保。別シェル /teacher と生徒設定から呼ぶ。
import { randomBytes } from "crypto"
import { prisma } from "@/app/_libs/prisma"
import { isMoodTagId } from "@/app/_libs/moodTags"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"
import { evaluateRateLimit, rateLimitMessage, MESSAGE_LIMIT, type RateLimitResult } from "@/app/_libs/rateLimit"

// 紛らわしい文字(0/O/1/I)を除いた6桁コード
function genInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const b = randomBytes(6)
  return Array.from(b, (x) => chars[x % chars.length]).join("")
}

// メッセージ連投(spam)の安全弁 (2026-08-08 P0-2)。送信者本人の直近メッセージ時刻で判定。
async function checkMessageRate(dbUserId: string, asTeacher: boolean): Promise<RateLimitResult> {
  const since = new Date(Date.now() - MESSAGE_LIMIT.windowMs)
  const rows = await prisma.message.findMany({
    where: asTeacher
      ? { teacherId: dbUserId, fromTeacher: true, createdAt: { gte: since } }
      : { studentId: dbUserId, fromTeacher: false, createdAt: { gte: since } },
    select: { createdAt: true },
  })
  return evaluateRateLimit(rows.map((r) => r.createdAt.getTime()), Date.now(), MESSAGE_LIMIT)
}

/** 先生: 自分の招待コードを取得(無ければ発行)。 */
export async function getOrCreateInviteCode(): Promise<
  { ok: true; code: string } | { ok: false; error: string }
> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const me = await prisma.user.findUnique({
    where: { id: auth.user.dbUser.id },
    select: { teacherInviteCode: true },
  })
  if (me?.teacherInviteCode) return { ok: true, code: me.teacherInviteCode }

  // 衝突しないコードを数回リトライで発行
  for (let i = 0; i < 8; i++) {
    const code = genInviteCode()
    const exists = await prisma.user.findUnique({ where: { teacherInviteCode: code }, select: { id: true } })
    if (exists) continue
    try {
      await prisma.user.update({ where: { id: auth.user.dbUser.id }, data: { teacherInviteCode: code } })
      return { ok: true, code }
    } catch {
      // 競合したら次のコードで再試行
    }
  }
  return { ok: false, error: "コード発行に失敗しました。もう一度お試しください" }
}

/** 生徒: 招待コードで先生と紐付ける。 */
export async function linkWithInviteCode(
  codeRaw: string,
): Promise<{ ok: true; teacherName: string } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const code = (codeRaw || "").trim().toUpperCase()
  if (code.length < 4) return { ok: false, error: "コードを入力してください" }

  try {
    const teacher = await prisma.user.findUnique({
      where: { teacherInviteCode: code },
      select: { id: true, name: true, role: true },
    })
    if (!teacher || teacher.role !== "teacher") return { ok: false, error: "コードが見つかりません" }
    if (teacher.id === auth.user.dbUser.id) return { ok: false, error: "自分自身とは紐付けできません" }

    await prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId: teacher.id, studentId: auth.user.dbUser.id } },
      create: { teacherId: teacher.id, studentId: auth.user.dbUser.id },
      update: {},
    })
    return { ok: true, teacherName: teacher.name }
  } catch {
    // 本番マイグレーション適用前など、テーブル/カラム未整備時に安全に失敗する
    return { ok: false, error: "現在この機能はご利用いただけません" }
  }
}

export type CreateAssignmentInput = {
  studentId: string
  scoreId?: string | null
  practiceItemId?: string | null
  targetMeasures?: string | null
  reps?: number | null
  targetTempo?: number | null
  comment?: string | null
  /** 提出期限 (ISO 文字列)。null=なし */
  dueDate?: string | null
  /** 合格条件: "score"=目標点数 / "achieve"=達成 / "master"=マスター */
  goalType?: "score" | "achieve" | "master" | null
  /** goalType="score" のときの合格ライン(0-100) */
  targetScore?: number | null
  /** 意識する表現 (統一雰囲気タグ台帳のID・任意) */
  moodTagId?: string | null
}

/** 先生: 担当生徒に宿題を出す。 */
export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }

  // 担当生徒であることを確認 (他人に宿題を出せない)
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: auth.user.dbUser.id, studentId: input.studentId } },
    select: { id: true },
  })
  if (!link) return { ok: false, error: "担当していない生徒です" }
  if (!input.scoreId && !input.practiceItemId)
    return { ok: false, error: "対象の曲または教材を選んでください" }

  // 合格条件: 点数は 0-100 にクランプ。達成/マスターは targetScore 不要。
  const goalType = input.goalType ?? null
  const targetScore =
    goalType === "score" && input.targetScore != null
      ? Math.max(0, Math.min(100, Math.round(input.targetScore)))
      : null
  const dueDate = input.dueDate ? new Date(input.dueDate) : null

  // 数値・文字数の防御的クランプ (2026-08-08 Wave9)。UI外/直接呼び出しでも異常値を弾く。
  const clampInt = (v: number | null | undefined, lo: number, hi: number): number | null =>
    v == null || !Number.isFinite(v) ? null : Math.max(lo, Math.min(hi, Math.round(v)))

  await prisma.assignment.create({
    data: {
      teacherId: auth.user.dbUser.id,
      studentId: input.studentId,
      scoreId: input.scoreId ?? null,
      practiceItemId: input.practiceItemId ?? null,
      targetMeasures: input.targetMeasures?.trim().slice(0, 50) || null,
      reps: clampInt(input.reps, 1, 999),
      targetTempo: clampInt(input.targetTempo, 20, 400),
      comment: input.comment?.trim().slice(0, 500) || null,
      dueDate: dueDate && !isNaN(dueDate.getTime()) ? dueDate : null,
      goalType,
      targetScore,
      moodTagId: input.moodTagId && isMoodTagId(input.moodTagId) ? input.moodTagId : null,
    },
  })
  await notifyStudent(input.studentId, auth.user.dbUser.id, "assignment", input.comment)
  return { ok: true }
}

/** 生徒: 自分の先生(最初の1人)を返す。無ければ null。サイドバー項目の出し分けに使う。 */
export async function getMyTeacherLink(): Promise<{ teacherId: string; teacherName: string } | null> {
  const auth = await requireAuthAction()
  if (!auth.ok) return null
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: auth.user.dbUser.id },
      orderBy: { createdAt: "asc" },
      select: { teacher: { select: { id: true, name: true } } },
    })
    return link ? { teacherId: link.teacher.id, teacherName: link.teacher.name } : null
  } catch {
    // テーブル未整備時など安全に null
    return null
  }
}

/** 生徒: 「先生を探す」から先生とつながる(生徒起点)。公開プロフィールの先生のみ。 */
export async function connectToTeacher(
  teacherId: string,
): Promise<{ ok: true; teacherName: string } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (teacherId === auth.user.dbUser.id) return { ok: false, error: "自分自身とは繋がれません" }
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { name: true, role: true, teacherProfile: { select: { published: true } } },
    })
    if (!teacher || teacher.role !== "teacher" || !teacher.teacherProfile?.published) {
      return { ok: false, error: "この先生とは繋がれません" }
    }
    await prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId, studentId: auth.user.dbUser.id } },
      create: { teacherId, studentId: auth.user.dbUser.id },
      update: {},
    })
    return { ok: true, teacherName: teacher.name }
  } catch {
    return { ok: false, error: "接続に失敗しました" }
  }
}

/** 生徒: 先生を解約する(自分の先生リンクを解除)。宿題履歴は残す。 */
export async function unlinkTeacher(): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    await prisma.teacherStudent.deleteMany({ where: { studentId: auth.user.dbUser.id } })
    return { ok: true }
  } catch {
    return { ok: false, error: "解約に失敗しました" }
  }
}

/** 生徒: 先生にメッセージ(質問)を送る。 */
export async function sendMessage(body: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const text = (body || "").trim()
  if (!text) return { ok: false, error: "メッセージを入力してください" }
  if (text.length > 1000) return { ok: false, error: "長すぎます（1000文字まで）" }
  const rl = await checkMessageRate(auth.user.dbUser.id, false)
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl) }
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: auth.user.dbUser.id },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true },
    })
    if (!link) return { ok: false, error: "先生が登録されていません" }
    await prisma.message.create({
      data: { teacherId: link.teacherId, studentId: auth.user.dbUser.id, fromTeacher: false, body: text },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "送信に失敗しました" }
  }
}

/** 先生: 担当生徒にメッセージを送る。performanceId 指定でその演奏に紐づく。 */
export async function sendMessageToStudent(
  studentId: string, body: string,
  performanceId?: string, performanceKind?: "score" | "practice",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const text = (body || "").trim()
  if (!text) return { ok: false, error: "メッセージを入力してください" }
  if (text.length > 1000) return { ok: false, error: "長すぎます（1000文字まで）" }
  const rl = await checkMessageRate(auth.user.dbUser.id, true)
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl) }
  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: auth.user.dbUser.id, studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }
    await prisma.message.create({
      data: {
        teacherId: auth.user.dbUser.id, studentId, fromTeacher: true, body: text,
        performanceId: performanceId ?? null,
        performanceKind: performanceId ? (performanceKind ?? null) : null,
      },
    })
    await notifyStudent(studentId, auth.user.dbUser.id, "message", text)
    return { ok: true }
  } catch {
    return { ok: false, error: "送信に失敗しました" }
  }
}

/** 先生: 生徒の達成を一緒に祝う (お祝いメッセージ・kind=celebration)。
 *  生徒側では特別なお祝い表示になり、メールも祝い件名で届く。 */
export async function sendCelebration(
  studentId: string, body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const text = (body || "").trim()
  if (!text) return { ok: false, error: "お祝いメッセージを入力してください" }
  if (text.length > 500) return { ok: false, error: "長すぎます（500文字まで）" }
  const rl = await checkMessageRate(auth.user.dbUser.id, true)
  if (!rl.ok) return { ok: false, error: rateLimitMessage(rl) }
  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: auth.user.dbUser.id, studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }
    await prisma.message.create({
      data: { teacherId: auth.user.dbUser.id, studentId, fromTeacher: true, body: text, kind: "celebration" },
    })
    await notifyStudent(studentId, auth.user.dbUser.id, "celebration", text)
    return { ok: true }
  } catch {
    return { ok: false, error: "送信に失敗しました" }
  }
}

/** 生徒: 宿題を提出する。performanceId 指定でその演奏を、未指定なら最新の評価済み演奏を紐付ける。 */
/** 宿題を合格にする (2026-08-11): クリア=提出→先生の合格。提出前は不可 */
export async function passAssignment(assignmentId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  try {
    const a = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId: auth.user.dbUser.id },
      select: { id: true, submittedAt: true, passedAt: true, studentId: true, score: { select: { title: true } }, practiceItem: { select: { title: true } } },
    })
    if (!a) return { ok: false, error: "宿題が見つかりません" }
    if (!a.submittedAt) return { ok: false, error: "まだ提出されていません" }
    if (a.passedAt) return { ok: true }
    await prisma.assignment.update({ where: { id: a.id }, data: { passedAt: new Date(), doneAt: new Date() } })
    const title = a.score?.title ?? a.practiceItem?.title ?? "宿題"
    await notifyStudent(a.studentId, auth.user.dbUser.id, "assignment", `宿題「${title}」に合格！`)
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}

export async function submitAssignment(
  assignmentId: string,
  performanceId?: string,
): Promise<{ ok: true; score: number | null } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const a = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { studentId: true, scoreId: true, practiceItemId: true },
    })
    if (!a || a.studentId !== auth.user.dbUser.id) return { ok: false, error: "対象の宿題がありません" }

    let perfId: string | null = null
    let score: number | null = null
    // performanceId 指定時は、その演奏が本人・対象曲/教材のものか where で検証して採用。
    if (a.scoreId) {
      const p = await prisma.performance.findFirst({
        where: {
          userId: auth.user.dbUser.id, scoreId: a.scoreId, rangeFromNote: null,
          pitchAccuracy: { not: null }, timingAccuracy: { not: null },
          ...(performanceId ? { id: performanceId } : {}),
        },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, pitchAccuracy: true, timingAccuracy: true },
      })
      if (p) { perfId = p.id; score = Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2) }
    } else if (a.practiceItemId) {
      const p = await prisma.practicePerformance.findFirst({
        where: {
          userId: auth.user.dbUser.id, practiceItemId: a.practiceItemId,
          pitchAccuracy: { not: null }, timingAccuracy: { not: null },
          ...(performanceId ? { id: performanceId } : {}),
        },
        orderBy: { uploadedAt: "desc" },
        select: { id: true, pitchAccuracy: true, timingAccuracy: true },
      })
      if (p) { perfId = p.id; score = Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2) }
    }
    if (!perfId) return { ok: false, error: "まず、この曲/教材を通して録音してください" }

    const now = new Date()
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { submittedPerformanceId: perfId, submittedScore: score, submittedAt: now, doneAt: now },
    })
    return { ok: true, score }
  } catch {
    return { ok: false, error: "提出に失敗しました" }
  }
}

export type SubmittablePerformance = { id: string; name: string; score: number | null; pitch: number | null; timing: number | null; date: string }

/** 生徒: この宿題に提出できる演奏(評価済み)の一覧。提出時に選ばせるために使う。 */
export async function listSubmittablePerformances(
  assignmentId: string,
): Promise<{ ok: true; items: SubmittablePerformance[] } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const me = auth.user.dbUser.id
  const dispName = (name: string | null) => {
    const m = /^Performance #?(\d+)$/i.exec(name ?? "")
    return m ? `#${m[1]}` : (name ?? "録音")
  }
  const toScore = (pitch: number | null, timing: number | null) =>
    pitch != null && timing != null ? Math.round((pitch + timing) / 2) : null
  const rnd = (v: number | null) => (v != null ? Math.round(v) : null)
  try {
    const a = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { studentId: true, scoreId: true, practiceItemId: true },
    })
    if (!a || a.studentId !== me) return { ok: false, error: "対象の宿題がありません" }

    if (a.scoreId) {
      const rows = await prisma.performance.findMany({
        where: { userId: me, scoreId: a.scoreId, rangeFromNote: null, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
        orderBy: { uploadedAt: "desc" }, take: 20,
        select: { id: true, name: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true },
      })
      return { ok: true, items: rows.map((p) => ({ id: p.id, name: dispName(p.name), score: toScore(p.pitchAccuracy, p.timingAccuracy), pitch: rnd(p.pitchAccuracy), timing: rnd(p.timingAccuracy), date: p.uploadedAt.toLocaleDateString("ja-JP") })) }
    }
    if (a.practiceItemId) {
      const rows = await prisma.practicePerformance.findMany({
        where: { userId: me, practiceItemId: a.practiceItemId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
        orderBy: { uploadedAt: "desc" }, take: 20,
        select: { id: true, name: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true },
      })
      return { ok: true, items: rows.map((p) => ({ id: p.id, name: dispName(p.name), score: toScore(p.pitchAccuracy, p.timingAccuracy), pitch: rnd(p.pitchAccuracy), timing: rnd(p.timingAccuracy), date: p.uploadedAt.toLocaleDateString("ja-JP") })) }
    }
    return { ok: true, items: [] }
  } catch {
    return { ok: false, error: "取得に失敗しました" }
  }
}

/** 生徒: 宿題を「やった」にする(完了時刻を刻む)。 */
export async function markAssignmentDone(
  assignmentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { studentId: true, doneAt: true },
  })
  if (!a || a.studentId !== auth.user.dbUser.id) return { ok: false, error: "対象の宿題がありません" }
  if (!a.doneAt) {
    await prisma.assignment.update({ where: { id: assignmentId }, data: { doneAt: new Date() } })
  }
  return { ok: true }
}

/** 生徒(D): 宿題でなくても、任意の演奏を「見てほしい」と先生に共有する。
 *  メッセージで先生に通知し、先生は生徒カルテの録音一覧から再生できる。 */
export async function sharePerformanceWithTeacher(
  performanceId: string,
  kind: "score" | "practice",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const me = auth.user.dbUser.id
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: me },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true },
    })
    if (!link) return { ok: false, error: "先生が登録されていません" }

    let title = "演奏"
    let label = ""
    let score: number | null = null
    if (kind === "score") {
      const p = await prisma.performance.findFirst({
        where: { id: performanceId, userId: me },
        select: { name: true, pitchAccuracy: true, timingAccuracy: true, score: { select: { title: true } } },
      })
      if (!p) return { ok: false, error: "対象の演奏が見つかりません" }
      title = p.score?.title ?? "曲"
      label = p.name ?? ""
      if (p.pitchAccuracy != null && p.timingAccuracy != null) score = Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
    } else {
      const p = await prisma.practicePerformance.findFirst({
        where: { id: performanceId, userId: me },
        select: { name: true, pitchAccuracy: true, timingAccuracy: true, practiceItem: { select: { title: true } } },
      })
      if (!p) return { ok: false, error: "対象の演奏が見つかりません" }
      title = p.practiceItem?.title ?? "教材"
      label = p.name ?? ""
      if (p.pitchAccuracy != null && p.timingAccuracy != null) score = Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
    }

    const body =
      `「${title}」${label ? `${label} ` : ""}の演奏を見てほしいです` +
      (score != null ? `（${score}点）` : "")
    await prisma.message.create({
      data: { teacherId: link.teacherId, studentId: me, fromTeacher: false, body },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "共有に失敗しました" }
  }
}
