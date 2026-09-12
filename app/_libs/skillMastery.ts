// わざマスター判定 (2026-09-01 Tetsuo確定・案4検定の記録表)。
// 基準: わざ×★ごとに指定された課題曲 (SkillMasterySong) をマスターすること。
// 選定方法の記録は memory/project_skill_mastery_criteria.md。
// 状態の規約:
//   done = 課題曲をマスター済み (UserScoreAchievement.masteredAt)
//   now  = 未マスターの課題曲のうち最小★ (いま挑戦する段)
//   lock = nowより上の★ (順にのぼる)
//   表示ランク = マスター済みの最大★ (順番飛ばしでマスターしても数える)
import { prisma } from "@/app/_libs/prisma"
import { MASTER_RECENT_COUNT } from "@/app/_libs/masteryRule"

export type SkillLadderRow = {
  star: number
  scoreId: string
  title: string
  state: "done" | "now" | "lock"
  /** doneのとき: マスター日 (YYYY.MM.DD JST) */
  masteredAt?: string
  /** nowのとき: 直近5回の平均点 (音程+リズム/2・公式録音のみ)。録音なしはnull。
      マスター判定 (lib/achievement.py MASTER_RECENT_COUNT=5 / MASTER_AVG=90) と同じ窓で数える */
  avg?: number | null
  /** nowのとき: 採点済みの回数。5回に満たないうちはマスター判定が始まらない */
  count?: number
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
        orderBy: { createdAt: "desc" },
        select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
      }),
    ])
    const masteredAt = new Map(achs.filter((a) => a.masteredAt != null).map((a) => [a.scoreId, a.masteredAt as Date]))
    // 新しい順に並べてあるので、曲ごとに先頭 MASTER_RECENT_COUNT 件だけを平均する。
    // total は判定が始まるまでの残り回数を出すために全件を数える
    const avgBy = new Map<string, { sum: number; n: number; total: number }>()
    for (const p of perfs) {
      const e = avgBy.get(p.scoreId) ?? { sum: 0, n: 0, total: 0 }
      e.total++
      if (e.n < MASTER_RECENT_COUNT) {
        e.sum += ((p.pitchAccuracy as number) + (p.timingAccuracy as number)) / 2
        e.n++
      }
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
            count: e?.total ?? 0,
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
