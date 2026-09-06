import "server-only"
/**
 * ゲスト用の見本データ (2026-09-06)。
 * ゲストホームの「いま練習している曲」「あなた専用のおすすめ練習」は、登録後に見える形そのままを
 * 見本として出す (Tetsuo確定)。中身は公式教材・共有曲から組み、本人の記録は一切使わない。
 * 成長カルテ・先生とのやりとりの見本は、運営アカウント (管理者用) の実データを読む。
 */
import { prisma } from "@/app/_libs/prisma"
import type { AchievementStatus } from "@/app/components/GoalTracker"
import type { DailyLesson } from "@/app/_libs/dailyLessons"
import type { PersonalReco, RecoCategory, RecoMaterial } from "@/app/_libs/personalRecoTypes"
import { GUEST_ID } from "@/app/_libs/viewer"

/** 見本の成長カルテ・先生画面に使う運営アカウント (管理者用)。本人の記録ではなく会社の見本 */
export const DEMO_AUTH_ID = "a0952076-2a93-4270-876d-0d8ece45a647"
export const DEMO_DB_ID = "cmmm46xn40000jgjytot9eobc"

export type GuestFeatured = { id: string; title: string; star: number | null; cover: string | null }

/** 最初の 1 曲の見本: 共有曲のうち ★ が小さい順。「きらきら星」があれば優先 */
export async function pickFeaturedScore(): Promise<GuestFeatured | null> {
  const rows = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null, partId: null, buildStatus: "done", analysisStatus: "done" },
    orderBy: [{ star: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, star: true, coverImagePath: true },
    take: 30,
  })
  const pick = rows.find((r) => r.title.includes("きらきら星")) ?? rows[0]
  return pick ? { id: pick.id, title: pick.title, star: pick.star, cover: pick.coverImagePath } : null
}

type Item = { id: string; title: string; category: string; star: number | null; keyTonic: string | null; keyMode: string | null; primaryPosition: number | null }

async function officialItems(category: string, take: number): Promise<Item[]> {
  // JSON 列 (rhythmRecipe / articulationRecipe) の null 判定は Prisma のフィルタでは書けないので、余分に取って JS 側で除く
  const rows = await prisma.practiceItem.findMany({
    where: { category: category as never, isPublished: true, ownerUserId: null, partId: null, buildStatus: "done" },
    orderBy: [{ star: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true, primaryPosition: true, rhythmRecipe: true, articulationRecipe: true },
    take: take * 8,
  }).catch(() => [])
  // 見本は読みやすい長調を先に (短調の表記ゆれを見本に出さない)
  const plain = rows.filter((r) => r.rhythmRecipe == null && r.articulationRecipe == null)
  const ordered = [...plain.filter((r) => r.keyMode === "major" || r.keyMode == null), ...plain.filter((r) => r.keyMode !== "major" && r.keyMode != null)]
  return ordered.slice(0, take).map(({ rhythmRecipe: _r, articulationRecipe: _a, ...rest }) => rest)
}

/** 「いま練習している曲」カードの見本: ゴールと毎日の基礎練を、公式教材で埋める */
export async function buildSampleAchievement(): Promise<AchievementStatus> {
  const [scale, fingering, bowing, etude] = await Promise.all([
    officialItems("scale", 1), officialItems("fingering", 1), officialItems("bowing", 1), officialItems("etude", 1),
  ])
  const lesson = (slot: DailyLesson["slot"], it: Item | undefined, label: string, reason: string, detail: string | null): DailyLesson | null =>
    it ? { slot, category: it.category, label, itemId: it.id, reason, detail, star: it.star, keyTonic: it.keyTonic, keyMode: it.keyMode, primaryPosition: it.primaryPosition } : null
  const dailyLessons = [
    lesson("scale", scale[0], "音階", "key", "調にあわせて"),
    lesson("fingering", fingering[0], "フィンガリング", "position", "ポジションにあわせて"),
    lesson("bowing", bowing[0], "ボーイング", "bowing", "主な弓の奏法"),
    lesson("rec", etude[0], "エチュード", "weak", "苦手な音の移動を多く含む"),
  ].filter((x): x is DailyLesson => !!x)
  return {
    dailyLessons,
    lessons: { total: 2, cleared: 1, nextLessonId: null },
    etude: etude[0] ? { required: true, id: etude[0].id, title: etude[0].title, achieved: false } : { required: false },
    cleanRuns: { count: 1, required: 3 },
    achieved: false,
    mastered: false,
    master: { recentAvg: 78, scoredCount: 3, requiredCount: 5, threshold: 90 },
    latestPerformanceId: null,
    totalPerformanceCount: 3,
  }
}

/** 「あなた専用のおすすめ練習」の見本: 4 タブとも中身を入れる (空の状態は出さない・Tetsuo確定) */
export async function buildSampleReco(): Promise<PersonalReco> {
  const [scales, fingerings, etudes, bowings] = await Promise.all([
    officialItems("scale", 2), officialItems("fingering", 2), officialItems("etude", 2), officialItems("bowing", 2),
  ])
  const toM = (rows: Item[]): RecoMaterial[] => rows.map((r) => ({ id: r.id, title: r.title, category: r.category, star: r.star, keyTonic: r.keyTonic ?? "C", keyMode: r.keyMode ?? "major" }))
  const tab = (key: RecoCategory, name: string, pct: number, rows: Item[]) => ({ key, focus: { name, successPct: pct }, materials: toM(rows), basics: false })
  return {
    tabs: [
      tab("pitch", "ラからドへの移動", 62, scales.length ? scales : etudes),
      tab("position", "第1から第3ポジションへ", 55, fingerings.length ? fingerings : scales),
      tab("technique", "スラーのファ", 48, etudes.length ? etudes : bowings),
      tab("fingering", "1の指から3の指", 70, fingerings.length ? fingerings : scales),
    ],
  }
}

export const guestHref = (path: string) => `/${GUEST_ID}${path}`
