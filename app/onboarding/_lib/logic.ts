// ============================================================
// オンボーディング判定ロジック (C3・2026-08-02 登録star整合版)
// 正本: docs/arcoda-design-spec.md §2-2b「技術⭐︎の正」= 学びレッスン教材の登録star。
// 旧版 (arcoda_onboarding_logic.js のC2移植) は旧⭐︎帯前提で14タグずれていたため、
// Tetsuo承認 (2026-08-02) のもとラダーの質問構造ごと登録starに合わせて再設計。
// 各関門 Gn は「★n帯の代表技術」を聞き、欠けがあれば★nで確定する。
// 検証: app/onboarding/_lib/logic.test.ts (§2-2b準拠の期待パターン)
// ============================================================

// 帯 = 登録star (§2-2b)。帯一括付与ルール: 確定★の1つ下の帯まで(1..star-1)+個別聴取分
// (2026-07-11確定の解釈Aを踏襲)。
export const BANDS: Record<number, string[]> = {
  1: ["スラー"],
  2: ["スタッカート", "ピチカート", "トレモロ", "ポルタート", "連続スタッカート"],
  3: ["スピッカート", "トリル", "プラルトリラーとモルデント"],
  4: ["ビブラート", "リコシェ"],
  5: ["グリッサンド", "ナチュラル・ハーモニクス"],
  6: [],
}

// 重音の帯 (§2-2b)。帯一括付与の対象 (tagKey は lessons/content.ts の ds() と同一体系)
export const DOUBLE_BY_BAND: Record<number, string> = {
  2: "6度",
  3: "3度",
  4: "オクターブ",
  5: "10度",
  6: "連続重音",
}

// ポジションは帯一括付与しない(個別聴取分のみ)。3rd=G4関門 / 5th=G5関門 /
// 2nd・4th・6th+=G6関門で聴取するため、上位★の通過者は自然に該当ポジションを持つ。
export const POSITION_TAG: Record<string, string> = {
  "2nd": "ポジション(2nd)", "3rd": "ポジション移動(3rd)", "4th": "ポジション(4th)",
  "5th": "ポジション(5th)", "6th+": "ポジション(6th以上)",
}

export type LadderAnswers = {
  beginner?: boolean
  /** G1 (★1関門): スラーで2音をつなげて弾ける */
  g1?: boolean
  /** G2 (★2関門): スタッカート|ピチカート|トレモロ */
  g2?: string[]
  /** G3 (★3関門): スピッカート|トリル */
  g3?: string[]
  /** G3欠け時の補足: 3rdポジ移動可 (★判定に不使用・タグのみ) */
  g3sup?: boolean
  /** G4 (★4関門): ビブラート|3rd */
  g4?: string[]
  /** G5 (★5関門): 5th|グリッサンド|ハーモニクス */
  g5?: string[]
  /** G6 (★6関門): 2nd|4th|6th+|連続重音 (1つ以上で★6) */
  g6?: string[]
}

export type JudgeResult = {
  star: number
  tags: string[]
  doubleStops: string[]
  notes: string[]
}

// ★判定+一括付与。
export function judge(a: LadderAnswers): JudgeResult {
  const notes: string[] = []
  const tags = new Set<string>()
  const doubleStops = new Set<string>()

  const g2 = a.g2 || [], g3 = a.g3 || [], g4 = a.g4 || [], g5 = a.g5 || [], g6 = a.g6 || []

  // ★確定: 各関門の代表技術に欠けがあればその★で止まる
  let star: number
  if (a.beginner) {
    star = 1 // これから始める → ★1確定・ラダースキップ
  } else if (!a.g1) {
    star = 1 // G1落ち
  } else if (g2.length < 3) {
    star = 2
  } else if (g3.length < 2) {
    star = 3
  } else if (g4.length < 2) {
    star = 4
  } else if (g5.length < 3) {
    star = 5
  } else {
    star = g6.length >= 1 ? 6 : 5
  }

  // 個別聴取分は関門通過に関係なく仮習得として付与
  g2.forEach((t) => tags.add(t))
  g3.forEach((t) => tags.add(t))
  if (g3.includes("トリル")) tags.add("プラルトリラーとモルデント") // トリルの短縮形として同帯
  if (g4.includes("ビブラート")) tags.add("ビブラート")
  if (g4.includes("3rd")) tags.add(POSITION_TAG["3rd"])
  if (g5.includes("グリッサンド")) tags.add("グリッサンド")
  if (g5.includes("ハーモニクス")) tags.add("ナチュラル・ハーモニクス")
  if (g5.includes("5th")) tags.add(POSITION_TAG["5th"])
  if (g6.includes("2nd")) tags.add(POSITION_TAG["2nd"])
  if (g6.includes("4th")) tags.add(POSITION_TAG["4th"])
  if (g6.includes("6th+")) tags.add(POSITION_TAG["6th+"])
  if (g6.includes("連続重音")) doubleStops.add("連続重音")
  if (a.g3sup) {
    tags.add(POSITION_TAG["3rd"])
    notes.push("補足質問: 移動可→ポジションフラグのみ付与(★判定に不使用)")
  }

  // 帯一括付与: 1 .. star-1 (技術+重音)
  for (let b = 1; b < star; b++) {
    BANDS[b].forEach((t) => tags.add(t))
    if (DOUBLE_BY_BAND[b]) doubleStops.add(DOUBLE_BY_BAND[b])
  }

  return { star, tags: [...tags], doubleStops: [...doubleStops], notes }
}

// 全フラグは PROVISIONAL で書き込む
export function toProvisionalFlags(result: JudgeResult) {
  return [
    ...result.tags.map((t) => ({ tag: t, state: "PROVISIONAL" as const })),
    ...result.doubleStops.map((d) => ({
      tag: d === "連続重音" ? d : `重音(${d})`,
      state: "PROVISIONAL" as const,
    })),
  ]
}

// DB保存用(C5): UserTagAcquisition の (tagType, tagKey) へ変換。
// tagKey は UserLessonClear と同じ体系 (lessons/content.ts の正本対応表):
//   technique = タグ名そのまま / position = 番号文字列("2".."6") /
//   double_stop = "3度"/"6度"/"オクターブ"/"10度"/"連続重音"
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
