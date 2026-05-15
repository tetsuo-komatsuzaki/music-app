

export type ScoreView = {
  id: string
  title: string
  composer: string | null
  createdAt: string
  isOwn: boolean   // 認証ユーザーが作成者か (true=自分のスコア / false=共有スコア等)
  /** v1.6 Phase 4-2 Q2=a: 認証ユーザーがこの曲を完全習得済か (SongMastery.isFullyMastered) */
  isFullyMastered: boolean
}