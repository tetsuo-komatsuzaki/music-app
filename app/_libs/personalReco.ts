/**
 * personalReco.ts — ホーム「あなた専用のおすすめ練習」のエンジン (2026-09-04 Tetsuo確定)
 *
 * 規則は4タブ共通で1本:
 *   そのタブの課題のうち成功率が一番低い1件を選び、
 *   ユーザーの★以下の教材から、その課題がいちばん多く出てくる1件を出す。
 *
 * 「一番低い」の定義 (2026-09-04 確定):
 *   成功率 = 1 - matchedCount / totalCount。UserSkillSubScore の生涯累積。
 *   そのタブに属する診断対象の課題だけを比較する。
 *   判定音が MIN_TARGET 未満の課題は候補外。同率は判定音の多い方。
 *   弱点なしの分岐は作らない。全部低いユーザーはリード文だけ変える。
 *
 * 教材の出現回数は PracticeItemSubtaskCount に事前計算してある。
 * 数え方は lib/diagnosis.py の _context_suffixes で、ユーザーの演奏を判定するのと
 * 同じ関数を教材に向けて回したもの。両側で数え方がずれない。
 * 投入は music-analyzer/scripts/build_material_subtask_counts.py。
 */
import { prisma } from "./prisma"
import { SUBTASK_BY_ID, type SubtaskDef } from "./subtaskCatalog.generated"
import type { PersonalReco, RecoCategory, RecoTab, RecoMaterial } from "./personalRecoTypes"

/** 候補に入るのに必要な判定音数。累積推薦と同じ足切り */
export const MIN_TARGET = 10

/** 全課題の成功率がこれを下回るなら、一点を指さず基礎として案内する */
export const ALL_LOW_PCT = 50

/** 課題がどのタブに属するか。音程の木だけを使う (リズムの木は同じ課題の別の観点) */
export function tabOf(d: SubtaskDef): RecoCategory | null {
  if (d.tree !== "pitch") return null
  if (d.problem === "position_shift") return "position"
  if (d.problem === "technique") return "technique"
  if (d.problem === "interval_move" || d.problem === "double_stop") return "pitch"
  return null
}

const ORDER: RecoCategory[] = ["pitch", "position", "technique", "fingering"]

/**
 * タブごとに、どのカテゴリの教材から選ぶか (2026-09-04 Tetsuo確定)。
 * 絞らないと必ずエチュードが勝つ。エチュードは長いので回数で圧勝し、
 * ★6以下では31項目すべてでカイザーが出ていた。
 *   ポジション移動 = position_shift ・ fingering
 *   わざ           = etude
 *   フィンガリング   = fingering
 * 音程は未確定。暫定で音の動きを扱う3カテゴリにしてある。
 */
const TAB_CATEGORIES: Record<RecoCategory, string[]> = {
  pitch: ["scale", "arpeggio", "double_stop"],
  position: ["position_shift", "fingering"],
  technique: ["etude"],
  fingering: ["fingering"],
}

type Focus = { def: SubtaskDef; successPct: number; total: number }

/** ユーザーの★。オンボの進行を正とし、無ければ演奏実績の最高★ */
async function userStar(userId: string): Promise<number> {
  const [progress, perf] = await Promise.all([
    prisma.userStarProgress.findUnique({
      where: { userId },
      select: { currentStar: true },
    }),
    prisma.performance.findFirst({
      where: { userId, score: { star: { not: null } } },
      orderBy: { score: { star: "desc" } },
      select: { score: { select: { star: true } } },
    }),
  ])
  return progress?.currentStar ?? perf?.score.star ?? 1
}

/** その課題がいちばん多く出てくる教材。タブのカテゴリと★以下に絞る */
async function topMaterial(
  subtaskId: string,
  star: number,
  categories: string[]
): Promise<RecoMaterial | null> {
  const row = await prisma.practiceItemSubtaskCount.findFirst({
    where: {
      subtaskId,
      practiceItem: {
        isPublished: true,
        category: { in: categories as never },
        star: { not: null, lte: star },
      },
    },
    orderBy: [{ count: "desc" }],
    select: {
      count: true,
      practiceItem: {
        select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true },
      },
    },
  })
  if (!row) return null
  const m = row.practiceItem
  return {
    id: m.id,
    title: m.title,
    category: m.category,
    star: m.star,
    keyTonic: m.keyTonic,
    keyMode: m.keyMode,
  }
}

/**
 * ホームの4タブぶんを組み立てる。
 * どのタブにも候補が立たなければ null を返し、呼び手は枠ごと出さない。
 */
export async function buildPersonalReco(userId: string): Promise<PersonalReco | null> {
  let rows: { skillSubTaskId: string; matchedCount: number; totalCount: number }[]
  try {
    rows = await prisma.userSkillSubScore.findMany({
      where: { userId },
      select: { skillSubTaskId: true, matchedCount: true, totalCount: true },
    })
  } catch {
    // カウンタが未整備の環境でホームを落とさない
    return null
  }
  if (rows.length === 0) return null

  // タブごとに、成功率のいちばん低い課題を1つ選ぶ
  const best = new Map<RecoCategory, Focus>()
  const bestOfTab = new Map<RecoCategory, number>() // 各タブの最良の成功率
  for (const r of rows) {
    const def = SUBTASK_BY_ID[r.skillSubTaskId]
    if (!def || !def.diagnosable || !def.v1Active) continue
    const tab = tabOf(def)
    if (!tab) continue
    if (r.totalCount < MIN_TARGET) continue
    const pct = Math.round((1 - r.matchedCount / r.totalCount) * 100)
    const cur = best.get(tab)
    // 一番低い1件。同率は判定音の多い方
    if (!cur || pct < cur.successPct || (pct === cur.successPct && r.totalCount > cur.total)) {
      best.set(tab, { def, successPct: pct, total: r.totalCount })
    }
    const top = bestOfTab.get(tab)
    if (top === undefined || pct > top) bestOfTab.set(tab, pct)
  }
  if (best.size === 0) return null

  const star = await userStar(userId)
  const tabs: RecoTab[] = await Promise.all(
    ORDER.map(async (key): Promise<RecoTab> => {
      const f = best.get(key)
      if (!f) return { key, focus: null, materials: [], basics: false }
      const m = await topMaterial(f.def.id, star, TAB_CATEGORIES[key])
      return {
        key,
        focus: { name: f.def.name, successPct: f.successPct },
        materials: m ? [m] : [],
        // このタブの課題がどれも低いなら、一点ではなく基礎として案内する
        basics: (bestOfTab.get(key) ?? 100) < ALL_LOW_PCT,
      }
    })
  )
  return { tabs }
}
