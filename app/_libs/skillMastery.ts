// わざマスター判定 (2026-09-01 Tetsuo確定・案4検定の記録表)。
// 基準: わざ×★ごとに指定された課題曲 (SkillMasterySong) をマスターすること。
// 選定方法の記録は memory/project_skill_mastery_criteria.md。
// 状態の規約:
//   done = 課題曲をマスター済み (UserScoreAchievement.masteredAt)
//   now  = 未マスターの課題曲のうち最小★ (いま挑戦する段)
//   lock = nowより上の★ (順にのぼる)
//   表示ランク = マスター済みの最大★ (順番飛ばしでマスターしても数える)
import { prisma } from "@/app/_libs/prisma"

export type SkillLadderRow = {
  star: number
  scoreId: string
  title: string
  state: "done" | "now" | "lock"
  /** doneのとき: マスター日 (YYYY.MM.DD JST) */
  masteredAt?: string
  /** nowのとき: いまの平均点 (音程+リズム/2・公式録音のみ)。録音なしはnull */
  avg?: number | null
}

export type SkillMasteryEntry = {
  /** マスター済みの最大★。1つも無ければnull */
  rank: number | null
  ladder: SkillLadderRow[]
}

function fmtJst(d: Date): string {
  const j = new Date(d.getTime() + 9 * 3600_000)
  return `${j.getUTCFullYear()}.${j.getUTCMonth() + 1}.${j.getUTCDate()}`
}

/** 全わざぶんのマスター状況。テーブル未整備環境でも落ちない (read防御) */
export async function getSkillMastery(userId: string): Promise<Map<string, SkillMasteryEntry>> {
  const out = new Map<string, SkillMasteryEntry>()
  try {
    const songs = await prisma.skillMasterySong.findMany({
      orderBy: [{ skillId: "asc" }, { star: "asc" }],
      select: { skillId: true, star: true, scoreId: true, score: { select: { title: true, deletedAt: true } } },
    })
    const alive = songs.filter((s) => !s.score.deletedAt)
    if (alive.length === 0) return out

    const scoreIds = [...new Set(alive.map((s) => s.scoreId))]
    const [achs, perfs] = await Promise.all([
      prisma.userScoreAchievement.findMany({
        where: { userId, scoreId: { in: scoreIds } },
        select: { scoreId: true, masteredAt: true },
      }),
      prisma.performance.findMany({
        where: { userId, scoreId: { in: scoreIds }, pitchAccuracy: { not: null }, timingAccuracy: { not: null }, rangeFromNote: null },
        select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
      }),
    ])
    const masteredAt = new Map(achs.filter((a) => a.masteredAt != null).map((a) => [a.scoreId, a.masteredAt as Date]))
    const avgBy = new Map<string, { sum: number; n: number }>()
    for (const p of perfs) {
      const e = avgBy.get(p.scoreId) ?? { sum: 0, n: 0 }
      e.sum += ((p.pitchAccuracy as number) + (p.timingAccuracy as number)) / 2
      e.n++
      avgBy.set(p.scoreId, e)
    }

    const bySkill = new Map<string, typeof alive>()
    for (const s of alive) {
      const arr = bySkill.get(s.skillId) ?? []
      arr.push(s)
      bySkill.set(s.skillId, arr)
    }
    for (const [skillId, rows] of bySkill) {
      const sorted = rows.slice().sort((a, b) => a.star - b.star)
      let nowAssigned = false
      let rank: number | null = null
      const ladder: SkillLadderRow[] = sorted.map((r) => {
        const m = masteredAt.get(r.scoreId)
        if (m) {
          rank = Math.max(rank ?? 0, r.star)
          return { star: r.star, scoreId: r.scoreId, title: r.score.title, state: "done" as const, masteredAt: fmtJst(m) }
        }
        if (!nowAssigned) {
          nowAssigned = true
          const e = avgBy.get(r.scoreId)
          return {
            star: r.star, scoreId: r.scoreId, title: r.score.title, state: "now" as const,
            avg: e ? Math.round(e.sum / e.n) : null,
          }
        }
        return { star: r.star, scoreId: r.scoreId, title: r.score.title, state: "lock" as const }
      })
      out.set(skillId, { rank, ladder })
    }
  } catch (e) {
    console.error("[skillMastery] 読み取り失敗 (機能は落とさない):", e instanceof Error ? e.message : e)
  }
  return out
}
