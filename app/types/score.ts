

export type ScoreView = {
  id: string
  title: string
  composer: string | null
  createdAt: string
  isOwn: boolean   // 認証ユーザーが作成者か (true=自分のスコア / false=共有スコア等)
  /** C-6b (2026-07-11): 達成/マスターの2段バッジ (UserScoreAchievement 由来) */
  badge: "mastered" | "achieved" | null
}