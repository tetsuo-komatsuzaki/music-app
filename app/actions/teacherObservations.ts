"use server"

// 先生の所見 (2026-08-02)。癖タグ(選択式)+程度+任意コメントで記録する。
// タグの正本は app/_libs/observationCatalog.ts。生徒にも表示される。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"
import { OBSERVATION_TAG_BY_ID } from "@/app/_libs/observationCatalog"
import { SKILL_ID_LABELS } from "@/app/_libs/growthKarte"

const SKILL_ID_SET = new Set(SKILL_ID_LABELS.map((s) => s.id))

export async function createObservation(input: {
  studentId: string
  tagIds: string[]
  /** 関係するわざ (2026-08-11): 先生が明示的に選ぶ。自動マッピングは廃止 */
  skillIds?: string[]
  severity?: "mild" | "focus" | null
  comment?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  // カタログに存在するタグだけ受け付ける
  const tagIds = [...new Set((input.tagIds ?? []).filter((t) => OBSERVATION_TAG_BY_ID[t]))].slice(0, 12)
  const skillIds = [...new Set((input.skillIds ?? []).filter((id) => SKILL_ID_SET.has(id)))].slice(0, 4)
  const comment = (input.comment ?? "").trim().slice(0, 500) || null
  if (tagIds.length === 0 && !comment) return { ok: false, error: "タグを選ぶかコメントを書いてください" }
  const severity = input.severity === "mild" || input.severity === "focus" ? input.severity : null

  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId: input.studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }

    await prisma.teacherObservation.create({
      data: { teacherId, studentId: input.studentId, tagIds, skillIds, severity, comment },
    })

    const preview = tagIds.map((t) => OBSERVATION_TAG_BY_ID[t].label).join("・") || comment || ""
    await notifyStudent(input.studentId, teacherId, "observation", preview)
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}

// 癖の経過記録 (2026-08-02): レッスン直後に先生がワンタップで更新する。
// 新しい所見行を積む(履歴が時系列で残る)。タグの現在状態 = そのタグを含む最新行の severity。
//  - still     … まだある (元の程度で再記録して日付を更新)
//  - improving … 良くなってきた
//  - resolved  …克服 (癖マップから卒業・あゆみにイベント)
export async function recordObservationProgress(input: {
  studentId: string
  tagId: string
  status: "still" | "improving" | "resolved"
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  const tag = OBSERVATION_TAG_BY_ID[input.tagId]
  if (!tag) return { ok: false, error: "不明なタグです" }
  if (!["still", "improving", "resolved"].includes(input.status)) return { ok: false, error: "不明な状態です" }

  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId: input.studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }

    let severity: string
    if (input.status === "still") {
      const prev = await prisma.teacherObservation.findFirst({
        where: { teacherId, studentId: input.studentId, tagIds: { has: input.tagId } },
        orderBy: { createdAt: "desc" },
        select: { severity: true },
      })
      severity = prev?.severity === "focus" ? "focus" : "mild"
    } else {
      severity = input.status
    }

    await prisma.teacherObservation.create({
      data: { teacherId, studentId: input.studentId, tagIds: [input.tagId], severity, comment: null },
    })

    // まだある(still)はメール通知しない (状態維持のノイズになるため)
    if (input.status === "improving") await notifyStudent(input.studentId, teacherId, "observation", `「${tag.label}」が良くなってきた、と先生が記録しました`)
    if (input.status === "resolved") await notifyStudent(input.studentId, teacherId, "observation", `「${tag.label}」の癖を克服！と先生が記録しました`)
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
