

export type ScoreView = {
  id: string
  title: string
  composer: string | null
  createdAt: string
  isOwn: boolean   // 認証ユーザーが作成者か (true=自分のスコア / false=共有スコア等)
}