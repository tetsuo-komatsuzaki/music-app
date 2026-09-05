/**
 * personalReco.ts — ホーム「あなた専用のおすすめ練習」のエンジン (2026-09-05 ノート属性ストア版)
 *
 * 規則は4タブ共通で1本 (仕様 §5・Tetsuo確定):
 *   1 単位を選ぶ   ホームは累計 ・ そのユーザーの全演奏
 *   2 明細を束ねる タブの列で束ね、成功率 = 1 − ミス ÷ 弾いた。足切り MIN_TARGET 音。
 *                  足切り → 候補なし、全部100% → 弱点なし、いちばん低い1件 (同率は弾いた回数の多い方)
 *   3 教材を探す   ユーザーの★以下・タブの棚の中で、その束を最も多く含む教材1件
 *
 * タブの束ね方:
 *   音程           前の音名 → 今の音名                         棚 音階・アルペジオ・重音
 *   ポジション移動 前の手のポジション → 今の手のポジション     棚 ポジション移動・フィンガリング
 *   わざ           奏法13種のそれぞれ                          棚 エチュード
 *   フィンガリング 前の音名 → 今の音名 ・ 開放弦と同じ音名は除く ・ 前の音からの実時間 0.3秒未満   棚 フィンガリング
 *
 * 課題カタログや事前集計 (UserSkillSubScore / PracticeItemSubtaskCount) は使わない。
 * 読むのは NoteProfile / ScoreNote / PerformanceNote だけ (app/_libs/noteStore.ts)。
 */
import { prisma } from "./prisma"
import { aggregate, pickWeakest, parseKey, prismaSource, type NoteStoreSource, type TabKey, type GroupKey } from "./noteStore"
import { movementLabel, fastSwitchLabel, positionMoveLabel, techniqueLabel } from "./conditionName"
import type { PersonalReco, RecoCategory, RecoTab, RecoMaterial } from "./personalRecoTypes"

/** 候補に入るのに必要な弾いた音数 ・ ホームの累計 (R4) */
export const MIN_TARGET = 10

/** 全課題の成功率がこれを下回るなら、一点を指さず基礎として案内する */
export const ALL_LOW_PCT = 50

const ORDER: RecoCategory[] = ["pitch", "position", "technique", "fingering"]

/** タブごとの棚 (2026-09-04/05 Tetsuo確定) */
export const TAB_CATEGORIES: Record<RecoCategory, string[]> = {
  pitch: ["scale", "arpeggio", "double_stop"],
  position: ["position_shift", "fingering"],
  technique: ["etude"],
  fingering: ["fingering"],
}

/** 束のキー → 見出し */
export function focusName(key: GroupKey): string {
  const { tab, a, b, c } = parseKey(key)
  switch (tab as TabKey) {
    case "pitch": return movementLabel(a, b)
    case "fingering": return fastSwitchLabel(a, b)
    case "position": return positionMoveLabel(parseInt(a, 10), parseInt(b, 10), c || undefined)
    case "technique": return techniqueLabel(a, b || undefined)
  }
}

/** ユーザーの★。オンボの進行を正とし、無ければ演奏実績の最高★ */
async function userStar(userId: string): Promise<number> {
  const [progress, perf] = await Promise.all([
    prisma.userStarProgress.findUnique({ where: { userId }, select: { currentStar: true } }),
    prisma.performance.findFirst({
      where: { userId, score: { star: { not: null } } },
      orderBy: { score: { star: "desc" } },
      select: { score: { select: { star: true } } },
    }),
  ])
  return progress?.currentStar ?? perf?.score.star ?? 1
}

async function materialOf(itemId: string): Promise<RecoMaterial | null> {
  const m = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true },
  })
  if (!m) return null
  return { id: m.id, title: m.title, category: m.category, star: m.star, keyTonic: m.keyTonic, keyMode: m.keyMode }
}

export type PersonalRecoDeps = {
  source: NoteStoreSource
  userStar: (userId: string) => Promise<number>
  materialOf: (itemId: string) => Promise<RecoMaterial | null>
}

const defaultDeps: PersonalRecoDeps = { source: prismaSource, userStar, materialOf }

/**
 * ホームの4タブぶんを組み立てる。
 * どのタブにも候補が立たなければ null を返し、呼び手は枠ごと出さない。
 * 表が無い環境でもホームを落とさない (読みの失敗は null)。
 */
export async function buildPersonalReco(userId: string, deps: PersonalRecoDeps = defaultDeps): Promise<PersonalReco | null> {
  let rows
  try {
    rows = await deps.source.fetchDetail({ userId })
  } catch {
    return null
  }
  if (rows.length === 0) return null

  const picks = ORDER.map((key) => ({ key, pick: pickWeakest(aggregate(key as TabKey, rows), MIN_TARGET) }))
  if (picks.every((p) => p.pick.status === "候補なし")) return null

  const star = await deps.userStar(userId)
  const tabs: RecoTab[] = await Promise.all(
    picks.map(async ({ key, pick }): Promise<RecoTab> => {
      if (pick.status !== "ok" || !pick.weakest) {
        return { key, focus: null, materials: [], basics: false }
      }
      const hit = await deps.source.findMaterial(pick.weakest.key, star, TAB_CATEGORIES[key])
      const m = hit ? await deps.materialOf(hit.itemId) : null
      return {
        key,
        focus: { name: focusName(pick.weakest.key), successPct: pick.weakest.successPct },
        materials: m ? [m] : [],
        // このタブの束がどれも低いなら、一点ではなく基礎として案内する
        basics: (pick.bestPct ?? 100) < ALL_LOW_PCT,
      }
    })
  )
  return { tabs }
}
