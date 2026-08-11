// rankCard.ts — マイランクカード / 演奏の軌跡(スタンプラリー)の表示ヘルパ
// 純粋関数のみ。データ源は gradeData(現在/達成数) + UserScoreAchievement(達成曲)。

export type PerfRank = "s" | "a" | "b" | "c"

/**ごとのランク名。 */
const RANK_NAMES: Record<number, string> = {
  1: "はじまりの奏者",
  2: "かけだしの奏者",
  3: "みならいの奏者",
  4: "見習いバイオリニスト",
  5: "一人前の奏者",
  6: "熟練の奏者",
  7: "名手",
  8: "達人",
  9: "巨匠",
  10: "マエストロ",
}

export function rankName(star: number): string {
  if (star >= 10) return RANK_NAMES[10]
  return RANK_NAMES[star] ?? "奏者"
}

export type CardTier = "bronze" | "silver" | "gold" | "holo"

/**でカードの豪華さ段階を変える・グレード帯と一致: 1-3/4-6/7-9/10。 */
export function cardTier(star: number): CardTier {
  if (star >= 10) return "holo"
  if (star >= 7) return "gold"
  if (star >= 4) return "silver"
  return "bronze"
}

/** 演奏スコア(音程+リズム平均) → ランク章 S/A/B/C。 */
export function perfRank(score: number | null | undefined): PerfRank | null {
  if (score == null) return null
  if (score >= 95) return "s"
  if (score >= 90) return "a"
  if (score >= 80) return "b"
  return "c"
}

/** ランク章 → 達成時のアルコの一言。 */
export function stampComment(rank: PerfRank | null): string {
  switch (rank) {
    case "s": return "アルコ「文句なしの演奏！すごい」"
    case "a": return "アルコ「きれいに弾けたね」"
    case "b": return "アルコ「よく頑張った！」"
    default:  return "アルコ「クリアおめでとう」"
  }
}

/** 達成数(0..required) に応じたアルコの応援。次のまでの残り曲数で締める。 */
export function cheerForCount(achieved: number, required: number): string {
  const remaining = Math.max(0, required - achieved)
  if (achieved <= 0) return "さあ、最初のスタンプを集めよう"
  if (remaining === 0) return `ぜんぶ揃った！ランクアップおめでとう！！`
  if (remaining === 1) return "あと1曲…！ドキドキするね、いける！"
  if (achieved === Math.floor(required / 2)) return "もう半分！すごいペースだね"
  if (remaining <= 3) return `残り${remaining}曲…！ゴールが近づいてきた`
  if (achieved === 1) return "はじめの1曲、おめでとう！ここからだよ"
  return `${achieved}曲め！いい調子、その調子〜`
}

export type RankStamp = {
  scoreId: string
  title: string
  best: number | null
  achievedAt: string | null
  href: string
}

export type RankCardData = {
  currentStar: number
  required: number
  achievedCount: number
  stamps: RankStamp[]
}

/** achievedAt(ISO) → "M/D"。 */
export function shortDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}
