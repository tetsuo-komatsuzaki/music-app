// アルコの週間サマリー (先生まとめ・2026-08-11 Tetsuo承認モック準拠)。
// 直近7日を先週7日とくらべた事実だけをルールベースで組み立てる (LLM不使用・提案文なし)。
// - 練習のリズム: 回数・日数・7日ドット・前週比 (±2以上のときだけ)
// - 練習した曲・基礎練ごとの回数 (2026-08-11 追加指示)
// - あたらしいこと: はじめての曲 / はじめてポジション移動のある曲
// - 音のへんか: 音程マップの週次差分 (両週n>=5のセルで15pt以上動いたもの全件)
import { prisma } from "./prisma"
import { categoryLabel } from "./practiceConstants"
import { buildUserHeatmapRange } from "./fingerboard/aggregate"

export type WeeklyChangeRow = {
  cellId: string
  /** 例 "ファ♯・E線" */
  label: string
  prevPct: number
  nowPct: number
  delta: number
  prevN: number
  prevMiss: number
  nowN: number
  nowMiss: number
  /** 今週いちばん崩れた遷移の説明 (なければ null) */
  worstTrans: string | null
}

export type WeeklySummaryData = {
  rangeLabel: string
  /** 7日ドット (古い→今日) */
  days: boolean[]
  count: number
  prevCount: number
  practicedDays: number
  /** 曲・教材ごとの練習回数 (今週・回数降順) */
  perTarget: { title: string; cat: string; count: number }[]
  /** 「はじめての◯◯」行 (0〜2件) */
  newThings: string[]
  changes: WeeklyChangeRow[]
}

const OPEN_MIDI: Record<string, number> = { G: 55, D: 62, A: 69, E: 76 }
const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"]
const DIR_LABEL = { high: "音が高い", low: "音が低い", mixed: "高低にブレ" } as const

function cellLabel(cellId: string): string {
  const m = /^cell-([GDAE])-(\d{2})$/.exec(cellId)
  if (!m) return cellId
  const midi = OPEN_MIDI[m[1]] + Number(m[2])
  return `${KANA[midi % 12]}・${m[1]}線${m[2] === "00" ? "・開放" : ""}`
}

export async function buildWeeklySummary(userId: string): Promise<WeeklySummaryData> {
  const now = new Date()
  const wStart = new Date(now.getTime() - 7 * 864e5)
  const pStart = new Date(now.getTime() - 14 * 864e5)
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

  const [perfs, pracs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId, uploadedAt: { gte: pStart } },
      select: { uploadedAt: true, scoreId: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, uploadedAt: { gte: pStart } },
      select: { uploadedAt: true, practiceItem: { select: { title: true, category: true } } },
    }),
  ])
  const all = [
    ...perfs.map((p) => ({ at: p.uploadedAt, title: p.score?.title ?? "曲", cat: "曲", scoreId: p.scoreId as string | null })),
    ...pracs.map((p) => ({ at: p.uploadedAt, title: p.practiceItem?.title ?? "教材", cat: p.practiceItem?.category ? categoryLabel(p.practiceItem.category) : "基礎練", scoreId: null })),
  ]
  const thisWeek = all.filter((x) => x.at >= wStart)
  const prevWeek = all.filter((x) => x.at < wStart)

  // 7日ドット (古い→今日)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d0 = wStart.getTime() + i * 864e5
    return thisWeek.some((x) => x.at.getTime() >= d0 && x.at.getTime() < d0 + 864e5)
  })
  const practicedDays = days.filter(Boolean).length

  // 曲・教材ごとの回数 (今週・降順)
  const perMap = new Map<string, { title: string; cat: string; count: number }>()
  for (const x of thisWeek) {
    const k = `${x.cat}:${x.title}`
    const e = perMap.get(k) ?? { title: x.title, cat: x.cat, count: 0 }
    e.count++
    perMap.set(k, e)
  }
  const perTarget = [...perMap.values()].sort((a, b) => b.count - a.count).slice(0, 10)

  // あたらしいこと: はじめての曲 / はじめてポジション移動のある曲
  const newThings: string[] = []
  try {
    const weekScoreIds = [...new Set(thisWeek.map((x) => x.scoreId).filter((x): x is string => !!x))]
    if (weekScoreIds.length) {
      const earlier = await prisma.performance.findMany({
        where: { userId, uploadedAt: { lt: wStart } },
        distinct: ["scoreId"], select: { scoreId: true },
      })
      const earlierIds = new Set(earlier.map((e) => e.scoreId))
      const newIds = weekScoreIds.filter((id) => !earlierIds.has(id))
      if (newIds.length) {
        const t = thisWeek.find((x) => x.scoreId === newIds[0])?.title
        if (t) newThings.push(`はじめての曲に挑戦・${t}`)
      }
      // ポジション移動のある曲に初挑戦か
      const [weekScores, earlierScores] = await Promise.all([
        prisma.score.findMany({ where: { id: { in: weekScoreIds } }, select: { id: true, title: true, positions: true } }),
        earlierIds.size
          ? prisma.score.findMany({ where: { id: { in: [...earlierIds] } }, select: { positions: true } })
          : Promise.resolve([]),
      ])
      const hasShift = (ps: number[]) => ps.some((n) => n >= 2)
      const weekShift = weekScores.find((s) => hasShift(s.positions))
      const earlierHadShift = earlierScores.some((s) => hasShift(s.positions))
      if (weekShift && !earlierHadShift) newThings.push(`はじめてポジション移動のある曲に挑戦・${weekShift.title}`)
    }
  } catch { /* 新規要素の判定に失敗しても他は出す */ }

  // 音のへんか: 週次差分 (両週n>=5・|Δ|>=15pt・全件・|Δ|降順)
  const changes: WeeklyChangeRow[] = []
  try {
    const [cur, prev] = await Promise.all([
      buildUserHeatmapRange(userId, wStart, null, 24),
      buildUserHeatmapRange(userId, pStart, wStart, 24),
    ])
    for (const [cellId, c] of Object.entries(cur.details)) {
      const p = prev.details[cellId]
      if (!p) continue // 両週 n>=5 のセルだけくらべる
      const nowPct = Math.round(((c.n - c.high - c.low) / c.n) * 100)
      const prevPct = Math.round(((p.n - p.high - p.low) / p.n) * 100)
      const delta = nowPct - prevPct
      if (Math.abs(delta) < 15) continue
      const wt = c.transitions.find((t) => t.miss > 0)
      changes.push({
        cellId, label: cellLabel(cellId),
        prevPct, nowPct, delta,
        prevN: p.n, prevMiss: p.high + p.low, nowN: c.n, nowMiss: c.high + c.low,
        worstTrans: wt ? `${wt.fromLabel}からの移動で${DIR_LABEL[wt.dir]}・${wt.n}回中${wt.miss}回` : null,
      })
    }
    changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  } catch { /* storage不通でも他は出す */ }

  return {
    rangeLabel: `${md(wStart)}〜${md(now)}`,
    days, count: thisWeek.length, prevCount: prevWeek.length, practicedDays,
    perTarget, newThings, changes,
  }
}
