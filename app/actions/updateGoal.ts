"use server"

// 目標の変更 (2026-08-02)。オンボーディングで答えた目標(目標曲/時期/かなえたいこと)を
// あとから変更できる。OnboardingProfile.answers の該当キーだけをマージ更新する。
// 曲はオンボと同じ OnboardingSong の候補から選ぶ (達成判定・旅の地図と整合)。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

export type GoalSongOption = { category: string; name: string; star: number }
export type MyGoal = {
  songCategory: string | null
  songName: string | null
  songStar: number | null
  goalDate: string | null
  epicWin: string | null
}

/** 目標曲の候補一覧 (オンボと同じリスト・カテゴリごと) */
export async function getGoalOptions(): Promise<{ ok: true; options: GoalSongOption[] } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const rows = await prisma.onboardingSong.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: { category: true, name: true, star: true },
    })
    return { ok: true, options: rows }
  } catch {
    return { ok: false, error: "候補の取得に失敗しました" }
  }
}

type Answers = {
  q4cat?: string
  q4song?: string
  q4star?: number
  q8?: string
  goalSong?: string | null
  goalDate?: string | null
  [k: string]: unknown
}

/** いまの目標を取得 */
export async function getMyGoal(): Promise<{ ok: true; goal: MyGoal } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const p = await prisma.onboardingProfile.findUnique({
      where: { userId: auth.user.dbUser.id },
      select: { answers: true },
    })
    const a = (p?.answers ?? {}) as Answers
    return {
      ok: true,
      goal: {
        songCategory: a.q4cat ?? null,
        songName: a.q4song ?? null,
        songStar: a.q4star ?? null,
        goalDate: a.goalDate ?? null,
        epicWin: a.goalSong || a.q8 || null,
      },
    }
  } catch {
    return { ok: false, error: "取得に失敗しました" }
  }
}

/** 目標を保存 (answers の該当キーのみマージ。他のオンボ回答は保持) */
export async function saveMyGoal(input: {
  songCategory: string
  songName: string
  goalDate?: string | null
  epicWin?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const userId = auth.user.dbUser.id
  try {
    // 候補リストで検証し、★も候補から確定する (自由入力は不可)
    const song = await prisma.onboardingSong.findUnique({
      where: { category_name: { category: input.songCategory, name: input.songName } },
      select: { star: true, isActive: true },
    })
    if (!song || !song.isActive) return { ok: false, error: "目標曲を候補から選んでください" }

    const p = await prisma.onboardingProfile.findUnique({
      where: { userId },
      select: { answers: true },
    })
    const prev = (p?.answers ?? {}) as Answers
    const next: Answers = {
      ...prev,
      q4cat: input.songCategory,
      q4song: input.songName,
      q4star: song.star,
      goalDate: (input.goalDate ?? "").trim().slice(0, 40) || null,
      goalSong: (input.epicWin ?? "").trim().slice(0, 200) || null,
    }
    await prisma.onboardingProfile.upsert({
      where: { userId },
      create: { userId, answers: next as object },
      update: { answers: next as object },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
