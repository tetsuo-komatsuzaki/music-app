"use server"

import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"

// 譜面注釈 (Phase 1, 2026-07-19)。音符アンカーのハイライト/テキスト/注意メモ。
// data 形状: { highlight: [...], warnings: [...], notation: [...] }
export type AnnotationData = {
  highlight?: Array<{ fromNote: number; toNote: number; color?: string }>
  warnings?: Array<{ noteIndex: number; dy?: number; kind: string; text?: string }>
  notation?: Array<{ noteIndex: number; kind: string; value?: string }>
}

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
  const data = params.data ?? {}

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
  return { ok: true }
}
