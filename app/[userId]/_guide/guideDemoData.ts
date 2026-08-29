// ============================================================
// 「アルコと最初の1周」デモ固定データ (2026-08-29)
// 正 = docs/mocks/first-loop-guide/ と guideFlow.ts の GUIDE_DEMO。
// デモは DB に一切書かない。実コンポーネントへ流し込む props と、
// dev ハーネスの fetch スタブが返す固定レスポンスをここに集約する。
// ============================================================

import type { ComponentProps } from "react"
import type HomeClient from "../home"
import type { AchievementStatus } from "@/app/components/GoalTracker"
import type { HeatmapData, CellDetail } from "@/app/_libs/fingerboard/heatmapTypes"

export type HomeProps = ComponentProps<typeof HomeClient>

export const DEMO_SONG_ID = "guide-demo-kirakira"

/** 弾けるリング前提 (学びレッスン✓・エチュード✓・通し2/3) — achievement-status スタブ */
export const ACH_BEFORE: AchievementStatus = {
  dailyLessons: [
    { slot: "scale", category: "scale", label: "音階", itemId: "demo-scale", reason: "key", detail: null, star: 1, keyTonic: null, keyMode: null, primaryPosition: null },
    { slot: "fingering", category: "fingering", label: "フィンガリング", itemId: "demo-fingering", reason: "position", detail: null, star: 1, keyTonic: null, keyMode: null, primaryPosition: 1 },
  ],
  lessons: { total: 1, cleared: 1, nextLessonId: null },
  etude: { required: true, id: "demo-etude", title: "エチュード", achieved: true },
  cleanRuns: { count: 2, required: 3 },
  achieved: false,
  mastered: false,
  master: { recentAvg: 69, scoredCount: 5, requiredCount: 5, threshold: 90 },
  latestPerformanceId: null,
  totalPerformanceCount: 5,
}

/** 達成後 (通し3/3・achieved)。GoalTracker は STEP2 (マスター挑戦) 表示になる */
export const ACH_AFTER: AchievementStatus = {
  ...ACH_BEFORE,
  cleanRuns: { count: 3, required: 3 },
  achieved: true,
  master: { recentAvg: 74, scoredCount: 5, requiredCount: 5, threshold: 90 },
  totalPerformanceCount: 6,
}

const GRADE_DATA = {
  currentStar: 1,
  currentGrade: "BEGINNER",
  masteredSongCountAtCurrentStar: 0,
  gradeUpRequired: 10,
  gradeUpRemaining: 10,
  isMaster: false,
  masterReachedAt: null,
} as HomeProps["gradeData"]

const BASE: Omit<HomeProps, "recentPieces" | "rankCard" | "starterPick"> = {
  // チュートリアル内で描く HomeClient には入れ子でガイドを起動させない
  guide: { active: false, initialStep: 0 },
  questProgress: null,
  userName: "きみ",
  streak: 1,
  weeklyDays: 1,
  arcoMessage: { greeting: "こんにちは", cheer: "きょうも1曲いこう" },
  gradeData: GRADE_DATA,
  basicPracticeCards: [],
  nextPieceRecommendations: [],
  favorites: [],
  teacherAssignments: [],
  teacherSummary: undefined,
  analysisNotices: [],
  skillLits: [],
  exprShelf: null,
}

/** step0: 初期ユーザーのホーム (さいしょの1曲カード) */
export const HOME_FRESH: HomeProps = {
  ...BASE,
  recentPieces: [],
  rankCard: { currentStar: 1, required: 10, achievedCount: 0, stamps: [] },
  starterPick: { title: "きらきら星", star: 1, reason: "きみのレベルにぴったり", href: `#demo-${DEMO_SONG_ID}`, cover: null },
}

/** 1周目のホーム (直近80点・リング2/3前提) */
export const HOME_LOOP: HomeProps = {
  ...BASE,
  recentPieces: [{
    id: DEMO_SONG_ID, title: "きらきら星", star: 1, cover: null,
    latest: 80, recentAvg: 69, badge: null, href: `#demo-${DEMO_SONG_ID}`,
  }],
  rankCard: { currentStar: 1, required: 10, achievedCount: 0, stamps: [] },
  starterPick: null,
}

/** 達成後のホーム (直近95点・達成バッジ・コイン1枚) */
export const HOME_DONE: HomeProps = {
  ...BASE,
  recentPieces: [{
    id: DEMO_SONG_ID, title: "きらきら星", star: 1, cover: null,
    latest: 95, recentAvg: 74, badge: "achieved", href: `#demo-${DEMO_SONG_ID}`,
  }],
  rankCard: {
    currentStar: 1, required: 10, achievedCount: 1,
    stamps: [{ scoreId: DEMO_SONG_ID, title: "きらきら星", best: 95, achievedAt: "2026-08-29", href: `#demo-${DEMO_SONG_ID}` }],
  },
  starterPick: null,
}

/** dev ハーネスの fetch スタブ: /api/ をデモ固定値で返す (DB・実APIに触れない) */
export function makeGuideFetchStub(ach: AchievementStatus): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const origFetch = typeof window !== "undefined" ? window.fetch.bind(window) : fetch
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (url.includes("/achievement-status")) {
      return new Response(JSON.stringify(ach), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    if (url.startsWith("/api/")) {
      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    return origFetch(input, init)
  }
}

// ── 音程マップのデモデータ (きらきら星・ニ長調・1stポジション) ──
// 赤 (高すぎ) = シ・A線 (cell-A-02)。ほかの使用音は安定。
// 詳細は案C: レから(D線)=移弦で音が高い(4回/6回) / ラから(同一弦)=音が正確(0回/4回)
function stableDetail(kana: string): CellDetail {
  return { n: 10, high: 0, low: 0, kana, positions: [], shiftSplit: null, transitions: [] }
}
export const DEMO_HEATMAP: HeatmapData = {
  perfCount: 10,
  cells: {
    "cell-D-00": { status: "stable", level: 1 },
    "cell-D-02": { status: "stable", level: 1 },
    "cell-D-04": { status: "stable", level: 1 },
    "cell-D-05": { status: "stable", level: 1 },
    "cell-A-00": { status: "stable", level: 1 },
    "cell-A-02": { status: "sharp", level: 2 },
  },
  details: {
    "cell-D-00": stableDetail("レ"),
    "cell-D-02": stableDetail("ミ"),
    "cell-D-04": stableDetail("ファ♯"),
    "cell-D-05": stableDetail("ソ"),
    "cell-A-00": stableDetail("ラ"),
    "cell-A-02": {
      n: 10, high: 4, low: 0, kana: "シ",
      positions: [{ position: 1, finger: 1, n: 10, miss: 4, dir: "high" }],
      shiftSplit: null,
      transitions: [
        { fromLabel: "レ", from: { s: "D", n: 0 }, badge: "移弦のみ", badgeKind: "info", n: 6, miss: 4, dir: "high" },
        { fromLabel: "ラ", from: { s: "A", n: 0 }, badge: "同じ弦", badgeKind: "info", n: 4, miss: 0, dir: "high" },
      ],
    },
  },
}
