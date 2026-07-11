// ============================================================
// オンボーディング判定ロジック (C2・2026-07-11)
// 正本: arcoda_onboarding_logic.js (Tetsuo確定) の TypeScript 移植。
// **数値パラメータの独断変更禁止** (指示書§1)。挙動同一性は
// scripts/verify-onboarding-logic.ts が参照JS(logic.reference.js)との
// 全11パターン比較で保証する。
// ============================================================

export const BANDS: Record<number, string[]> = {
  1: ["スラー", "ピチカート"],
  2: ["スタッカート", "スピッカート", "トリル", "モルデント"],
  3: ["ビブラート", "ポルタート", "トレモロ"],
  4: ["グリッサンド", "ナチュラル・ハーモニクス"], // ポジションは個別付与(§27-4-3)
  5: ["ボウ・スタッカート", "リコシェ"],
  6: [], // ポジション6th以上は個別付与
}

export const POSITION_TAG: Record<string, string> = {
  "2nd": "ポジション(2nd)", "3rd": "ポジション移動(3rd)", "4th": "ポジション(4th)",
  "5th": "ポジション(5th)", "6th+": "ポジション(6th以上)",
}

export type LadderAnswers = {
  beginner?: boolean
  g1?: boolean
  g2?: string[] // トリル|スタッカート|スピッカート
  g3?: boolean
  g3sup?: boolean
  g4?: string[] // 2nd|3rd|4th|5th|6th+
  g5?: boolean
}

export type JudgeResult = {
  star: number
  tags: string[]
  doubleStops: string[]
  notes: string[]
}

// ★判定+一括付与。
// ※ 帯一括付与ルール【確定 2026-07-11】: 「確定★の1つ下の帯まで(1..star-1)+個別聴取分」。
//    §27-4-3原文「未満(当該★を含む)」は誤記としてTetsuo承認のもと本解釈で確定。
export function judge(a: LadderAnswers): JudgeResult {
  const notes: string[] = []
  let star: number
  const tags = new Set<string>()
  let doubleStops: string[] = []

  if (a.beginner) {
    star = 1 // これから始める → ★1確定・ラダースキップ(§27-2)
  } else if (!a.g1) {
    star = 1 // G1落ち
  } else if ((a.g2 || []).length < 3) {
    star = 2 // G2: 1つでも欠け→★2、選択分は仮習得(§27-3)
    ;(a.g2 || []).forEach((t) => tags.add(t))
    if ((a.g2 || []).includes("トリル")) tags.add("モルデント") // トリルの短縮形として同帯(§27-4)
  } else if (!a.g3) {
    star = 3 // G3落ち
    if (a.g3sup) {
      tags.add(POSITION_TAG["3rd"])
      notes.push("補足質問: 移動可→ポジションフラグのみ付与(★判定に不使用)")
    }
  } else {
    const g4 = a.g4 || []
    const has = (p: string) => g4.includes(p)
    if (g4.length === 0) {
      star = 4 // 移動不可→★4確定
    } else if (!has("2nd") && !has("4th") && !has("5th") && !has("6th+")) {
      star = 4 // 3rdまで→★4確定
    } else {
      star = a.g5 ? 6 : 5 // G5: 重音可→★6(上限)/不可→★5
    }
    g4.forEach((p) => tags.add(POSITION_TAG[p])) // ポジションは選択分のみ付与(一括付与しない)
    if (star === 6) doubleStops = ["3度", "6度"] // G5通過者のみ(§27-4-3)
  }

  // 帯一括付与: 1 .. star-1(解釈A)
  for (let b = 1; b < star; b++) BANDS[b].forEach((t) => tags.add(t))

  return { star, tags: [...tags], doubleStops, notes }
}

// 全フラグは PROVISIONAL で書き込む(§27-5)
export function toProvisionalFlags(result: JudgeResult) {
  return [
    ...result.tags.map((t) => ({ tag: t, state: "PROVISIONAL" as const })),
    ...result.doubleStops.map((d) => ({ tag: `重音(${d})`, state: "PROVISIONAL" as const })),
  ]
}

// DB保存用(C5): UserTagAcquisition の (tagType, tagKey) へ変換。
// tagKey は工程Dの UserLessonClear と同じ体系に揃える(将来の要件①統合のため):
//   technique = タグ名そのまま / position = 番号文字列("2".."6") / double_stop = "3度"等
const _POSITION_KEY: Record<string, string> = {
  "ポジション(2nd)": "2", "ポジション移動(3rd)": "3", "ポジション(4th)": "4",
  "ポジション(5th)": "5", "ポジション(6th以上)": "6",
}

export function toAcquisitionFlags(
  result: JudgeResult,
): Array<{ tagType: string; tagKey: string }> {
  const flags: Array<{ tagType: string; tagKey: string }> = []
  for (const t of result.tags) {
    const posKey = _POSITION_KEY[t]
    if (posKey) flags.push({ tagType: "position", tagKey: posKey })
    else flags.push({ tagType: "technique", tagKey: t })
  }
  for (const d of result.doubleStops) flags.push({ tagType: "double_stop", tagKey: d })
  return flags
}

// ============================================================
// 到達予測ロジック v3(2026-07-11): ★差 × 練習時間 → 習得期間
// 全パラメータは Tetsuo 確定値(独断変更禁止)
// ============================================================
export const PREDICTION_PARAMS = {
  songBaseWeeks: { 1: 2, 2: 4, 3: 6, 4: 9, 5: 13, 6: 18, 7: 24 } as Record<number, number>,
  climbWeeks: { 2: 3, 3: 4, 4: 6, 5: 8, 6: 10, 7: 12 } as Record<number, number>,
  timeFactor: { "5分 / 日": 1.6, "15分 / 日": 1.0, "30分 / 日": 0.75, "それ以上": 0.6 } as Record<string, number>,
  sameLevelFactor: 0.5,
  belowLevelWeeks: 1, // 格下曲は練習時間によらず一律1週間(確定 2026-07-11)
  minWeeks: 1,
}

export function estimatePeriod(
  userStar: number,
  songStar: number,
  dailyKey: string,
): { weeks: number; label: string } {
  const P = PREDICTION_PARAMS
  let weeks: number
  if (songStar > userStar) {
    let climb = 0
    for (let k = userStar + 1; k <= songStar; k++) climb += P.climbWeeks[k] || 0
    weeks = (P.songBaseWeeks[songStar] + climb) * (P.timeFactor[dailyKey] ?? 1.0)
  } else if (songStar === userStar) {
    weeks = P.songBaseWeeks[songStar] * P.sameLevelFactor * (P.timeFactor[dailyKey] ?? 1.0)
  } else {
    weeks = P.belowLevelWeeks
  }
  weeks = Math.max(P.minWeeks, weeks)
  return { weeks, label: formatPeriod(weeks) }
}

export function formatPeriod(weeks: number): string {
  if (weeks < 5) return `約${Math.max(1, Math.round(weeks))}週間`
  const months = weeks / 4.345
  if (months < 12) return `約${Math.round(months)}ヶ月`
  if (months < 15) return "約1年"
  return "1年以上"
}

// 曲一覧の表示フィルタ【確定 2026-07-11】: ユーザー★と同ランク or 1つ上のみ表示
export type SongEntry = [name: string, star: number]
export function visibleSongs(songs: SongEntry[], userStar: number): SongEntry[] {
  return songs.filter(([, star]) => star === userStar || star === userStar + 1)
}
