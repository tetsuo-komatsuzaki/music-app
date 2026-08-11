"use server"

// 先生の練習ポイント (2026-08-11 先生カルテv3)。ホームの「毎日の基礎練」の
// おすすめ教材に先生が一言を添える。宿題(Assignment)ではない。upsert=編集可・空で削除。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export async function saveMaterialNote(input: {
  studentId: string
  practiceItemId: string
  point: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  const point = (input.point ?? "").trim().slice(0, 500)

  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId: input.studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }

    const item = await prisma.practiceItem.findUnique({
      where: { id: input.practiceItemId },
      select: { id: true },
    })
    if (!item) return { ok: false, error: "教材が見つかりません" }

    const key = { teacherId, studentId: input.studentId, practiceItemId: input.practiceItemId }
    if (!point) {
      // 空で保存 = ポイントを消す
      await prisma.teacherMaterialNote.deleteMany({ where: key })
      return { ok: true }
    }
    await prisma.teacherMaterialNote.upsert({
      where: { teacherId_studentId_practiceItemId: key },
      create: { ...key, point },
      update: { point },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
