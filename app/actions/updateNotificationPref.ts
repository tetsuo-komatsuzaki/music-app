"use server"

// 通知メールの配信停止設定 (2026-08-01)。生徒が「先生からの通知メール」をオフにできる。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export async function setTeacherEmailOff(
  off: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    await prisma.user.update({
      where: { id: auth.user.dbUser.id },
      data: { teacherEmailOff: off },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "設定の保存に失敗しました" }
  }
}
