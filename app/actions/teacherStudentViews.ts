"use server"

// 先生機能をスコア/ホーム/サイドバーに埋め込むための生徒側ビュー・クエリ (2026-08-01)。
// 既存の my-teacher ページ(ハブ)はそのまま。ここは「気づく→取り組む」導線用の軽量サマリ。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export type ScoreTeacherView = {
  hasTeacher: boolean
  teacherName: string | null
  /** この曲に紐づく未完了の宿題 (最新1件) */
  assignment: {
    id: string
    detail: string
    comment: string | null
    submitted: boolean
    dueDate: string | null
    goalType: string | null
    targetScore: number | null
    /** この曲の達成/マスター状態 (達成・マスター目標の自動判定用) */
    achieved: boolean
    mastered: boolean
  } | null
  /** この曲にこの生徒宛の添削(注釈)があるか */
  hasFeedback: boolean
}

const EMPTY_VIEW: ScoreTeacherView = {
  hasTeacher: false, teacherName: null, assignment: null, hasFeedback: false,
}

/** 生徒: 特定の曲に対する先生コンテキスト(宿題・添削)。スコア詳細のバナー用。 */
export async function getScoreTeacherView(scoreId: string): Promise<ScoreTeacherView> {
  const auth = await requireAuthAction()
  if (!auth.ok) return EMPTY_VIEW
  const me = auth.user.dbUser.id
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: me },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (!link) return EMPTY_VIEW

    const [assignment, feedback, achievement] = await Promise.all([
      prisma.assignment.findFirst({
        where: { studentId: me, scoreId, doneAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, targetMeasures: true, reps: true, targetTempo: true, comment: true, submittedAt: true,
          dueDate: true, goalType: true, targetScore: true,
        },
      }),
      prisma.teacherFeedback.findFirst({
        where: { teacherId: link.teacherId, studentId: me, scoreId },
        select: { id: true },
      }),
      prisma.userScoreAchievement.findUnique({
        where: { userId_scoreId: { userId: me, scoreId } },
        select: { masteredAt: true },
      }),
    ])

    return {
      hasTeacher: true,
      teacherName: link.teacher.name,
      assignment: assignment
        ? {
            id: assignment.id,
            detail: [
              assignment.reps && `×${assignment.reps}`,
              assignment.targetTempo && `♩=${assignment.targetTempo}`,
            ].filter(Boolean).join(" ・ "),
            comment: assignment.comment,
            submitted: assignment.submittedAt != null,
            dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
            goalType: assignment.goalType,
            targetScore: assignment.targetScore,
            achieved: achievement != null,
            mastered: achievement?.masteredAt != null,
          }
        : null,
      hasFeedback: !!feedback,
    }
  } catch {
    return EMPTY_VIEW
  }
}

export type TeacherStudentSummary = {
  hasTeacher: boolean
  teacherName: string | null
  /** 先生からの未読メッセージ数 */
  unreadMessages: number
  /** 未完了の宿題数 */
  openAssignments: number
  /** 先生の添削が付いた曲/教材の数 */
  feedbackCount: number
}

const EMPTY_SUMMARY: TeacherStudentSummary = {
  hasTeacher: false, teacherName: null, unreadMessages: 0, openAssignments: 0, feedbackCount: 0,
}

/** 生徒: 先生からの新着サマリ。ホームの「先生から」カード・サイドバーのバッジ用。 */
export async function getTeacherStudentSummary(): Promise<TeacherStudentSummary> {
  const auth = await requireAuthAction()
  if (!auth.ok) return EMPTY_SUMMARY
  const me = auth.user.dbUser.id
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: me },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (!link) return EMPTY_SUMMARY

    const [unreadMessages, openAssignments, feedbackCount] = await Promise.all([
      prisma.message.count({ where: { studentId: me, teacherId: link.teacherId, fromTeacher: true, readAt: null } }),
      prisma.assignment.count({ where: { studentId: me, doneAt: null } }),
      prisma.teacherFeedback.count({ where: { teacherId: link.teacherId, studentId: me } }),
    ])

    return {
      hasTeacher: true,
      teacherName: link.teacher.name,
      unreadMessages,
      openAssignments,
      feedbackCount,
    }
  } catch {
    return EMPTY_SUMMARY
  }
}
