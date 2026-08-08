"use server"

import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { sanitizeAnnotationData, type AnnotationData } from "@/app/_libs/annotationSanitize"

// 譜面注釈 (Phase 1, 2026-07-19)。音符アンカーのハイライト/テキスト/注意メモ。
// data 形状: { highlight: [...], warnings: [...], notation: [...] }。型/サニタイズは annotationSanitize に集約。
export type { AnnotationData }

type Target = { scoreId?: string; practiceItemId?: string }

function validTarget(t: Target): { userId?: never } | null {
  // どちらか一方のみ・cuid
  if (t.practiceItemId) return isValidCuid(t.practiceItemId) ? {} : null
  if (t.scoreId) return isValidCuid(t.scoreId) ? {} : null
  return null
}

export async function getScoreAnnotation(
  params: Target,
): Promise<{ ok: true; data: AnnotationData } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!validTarget(params)) return { ok: false, error: "対象が不正です" }
  const userId = auth.user.dbUser.id

  const rec = await prisma.scoreAnnotation.findFirst({
    where: params.practiceItemId
      ? { userId, practiceItemId: params.practiceItemId }
      : { userId, scoreId: params.scoreId },
    select: { data: true },
  })
  return { ok: true, data: (rec?.data as AnnotationData | null) ?? {} }
}

export async function saveScoreAnnotation(
  params: Target & { data: AnnotationData },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!validTarget(params)) return { ok: false, error: "対象が不正です" }
  const userId = auth.user.dbUser.id
  const data = sanitizeAnnotationData(params.data ?? {})

  try {
    if (params.practiceItemId) {
      await prisma.scoreAnnotation.upsert({
        where: { userId_practiceItemId: { userId, practiceItemId: params.practiceItemId } },
        create: { userId, practiceItemId: params.practiceItemId, data },
        update: { data },
      })
    } else if (params.scoreId) {
      await prisma.scoreAnnotation.upsert({
        where: { userId_scoreId: { userId, scoreId: params.scoreId } },
        create: { userId, scoreId: params.scoreId, data },
        update: { data },
      })
    }
  } catch (e: unknown) {
    // 同時初回保存の競合 (upsert は非アトミックで P2002 になり得る) → update で再試行 (行は既に存在)
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") {
      await prisma.scoreAnnotation.updateMany({
        where: params.practiceItemId
          ? { userId, practiceItemId: params.practiceItemId }
          : { userId, scoreId: params.scoreId },
        data: { data },
      })
    } else {
      throw e
    }
  }
  return { ok: true }
}
