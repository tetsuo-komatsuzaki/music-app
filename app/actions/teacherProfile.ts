"use server"

// 先生プロフィール (2026-08-01 Phase2)。先生が自分で編集し「先生を探す」に掲載する。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export type ProfileInput = {
  headline: string
  bio: string
  specialties: string[]
  levels: string[]
  forKids: boolean
  online: boolean
  priceNote: string
  trial: boolean
  sampleUrl: string
  published: boolean
}

export type ProfileData = ProfileInput

const EMPTY: ProfileData = {
  headline: "", bio: "", specialties: [], levels: [],
  forKids: false, online: true, priceNote: "", trial: false, sampleUrl: "", published: false,
}

/** 先生: 自分のプロフィールを取得(無ければ既定)。 */
export async function getMyProfile(): Promise<{ ok: true; data: ProfileData } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  try {
    const p = await prisma.teacherProfile.findUnique({ where: { teacherId: auth.user.dbUser.id } })
    if (!p) return { ok: true, data: EMPTY }
    return {
      ok: true,
      data: {
        headline: p.headline ?? "", bio: p.bio ?? "", specialties: p.specialties, levels: p.levels,
        forKids: p.forKids, online: p.online, priceNote: p.priceNote ?? "", trial: p.trial,
        sampleUrl: p.sampleUrl ?? "", published: p.published,
      },
    }
  } catch {
    return { ok: false, error: "取得に失敗しました" }
  }
}

/** 先生: プロフィールを保存(upsert)。 */
export async function saveMyProfile(input: ProfileInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id
  const clean = {
    headline: (input.headline ?? "").trim().slice(0, 60) || null,
    bio: (input.bio ?? "").trim().slice(0, 1000) || null,
    specialties: (input.specialties ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 20),
    levels: (input.levels ?? []).filter(Boolean).slice(0, 5),
    forKids: !!input.forKids,
    online: !!input.online,
    priceNote: (input.priceNote ?? "").trim().slice(0, 200) || null,
    trial: !!input.trial,
    sampleUrl: (input.sampleUrl ?? "").trim().slice(0, 500) || null,
    published: !!input.published,
  }
  try {
    await prisma.teacherProfile.upsert({
      where: { teacherId },
      create: { teacherId, ...clean },
      update: clean,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
