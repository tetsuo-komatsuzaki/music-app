"use server"

// 聴いてもらうリクエスト (2026-08-06 案1簡素版): ワンタップで先生へ演奏を届ける。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"

/** 生徒: この演奏を先生に聴いてもらう (コメント無し・ワンタップ) */
export async function createListenRequest(
  performanceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const me = auth.user.dbUser
  if (!isValidCuid(performanceId)) return { ok: false, error: "対象が不正です" }

  const link = await prisma.teacherStudent.findFirst({
    where: { studentId: me.id },
    select: { teacherId: true },
  })
  if (!link) return { ok: false, error: "先生とつながっていません" }

  const perf = await prisma.performance.findFirst({
    where: { id: performanceId, userId: me.id },
    select: { id: true, scoreId: true },
  })
  if (!perf) return { ok: false, error: "演奏が見つかりません" }

  try {
    await prisma.listenRequest.upsert({
      where: { studentId_performanceId: { studentId: me.id, performanceId: perf.id } },
      create: { studentId: me.id, teacherId: link.teacherId, performanceId: perf.id, scoreId: perf.scoreId },
      update: {}, // 二度押しは無害 (既に届いている)
    })
    return { ok: true }
  } catch (e) {
    console.error("[listenRequests] create failed:", e)
    return { ok: false, error: "送信に失敗しました" }
  }
}

/** 先生: リクエストを対応済みにする */
export async function resolveListenRequest(
  requestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  if (!isValidCuid(requestId)) return { ok: false, error: "対象が不正です" }
  const r = await prisma.listenRequest.updateMany({
    where: { id: requestId, teacherId: auth.user.dbUser.id, status: "pending" },
    data: { status: "done", resolvedAt: new Date() },
  })
  return r.count > 0 ? { ok: true } : { ok: false, error: "リクエストが見つかりません" }
}
