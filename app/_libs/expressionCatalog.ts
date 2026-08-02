// 表現技法カタログ (2026-08-03 カルテv2 Phase0-3・Tetsuo確定7語彙)。
// 先生が生徒の「表現の強み/挑戦中」を評価する語彙。記録は TeacherObservation を共用し、
// tagId は expr_ プレフィックスで癖タグと区別する (癖マップ等の既存表示からは除外)。
// 状態は severity 列に格納: strength(💪とくい) / challenge(🔥挑戦中) / improving(🌿良くなってきた)。
// 自由入力は `expr_free:<ラベル>` 形式の tagId で保存 (変換表未登録の間は表示のみ・推薦対象外)。
//
// 推薦への変換表 (先生語彙 ⇔ 曲の記号特徴) は project_karte_growth_requirements 確定6を正とし、
// 曲側の表現特徴解析 (スラー密度等) の実装時にここへ query を追加する。

export const EXPR_PREFIX = "expr_"
export const EXPR_FREE_PREFIX = "expr_free:"

export type ExpressionTag = { id: string; label: string; kid: string }

// kid = 子ども語の説明文 (カルテ表示は子ども語を優先する確定方針)
export const EXPRESSION_TAGS: ExpressionTag[] = [
  { id: "expr_legato_singing", label: "レガートの歌わせ方", kid: "音をなめらかにつなげて、歌うように弾く" },
  { id: "expr_articulation", label: "歯切れの良さ", kid: "音をキリッと切って、はっきり弾く" },
  { id: "expr_dynamics", label: "強弱の起伏づけ", kid: "つよい音とよわい音の差を大きくつける" },
  { id: "expr_rubato", label: "テンポの揺らし（ルバート）", kid: "ここぞという所で、テンポを少しゆらして歌う" },
  { id: "expr_phrasing", label: "フレーズの呼吸", kid: "文のくぎりのように、フレーズごとに息をつぐ" },
  { id: "expr_tone_depth", label: "音の深み・響き", kid: "楽器をよくひびかせて、ふかい音を出す" },
  { id: "expr_vibrato", label: "ビブラートの表情", kid: "ビブラートで音に色をつける" },
]

export const EXPRESSION_TAG_BY_ID: Record<string, ExpressionTag> =
  Object.fromEntries(EXPRESSION_TAGS.map((t) => [t.id, t]))

export const EXPRESSION_STATUSES = [
  { id: "strength", label: "💪 とくい（強み）" },
  { id: "improving", label: "🌿 良くなってきた" },
  { id: "challenge", label: "🔥 挑戦中（課題）" },
] as const
export type ExpressionStatus = (typeof EXPRESSION_STATUSES)[number]["id"]

/** 表現タグか (癖タグ・進捗記録と区別する) */
export function isExpressionTagId(tagId: string): boolean {
  return tagId.startsWith(EXPR_PREFIX)
}

/** 表示ラベル解決 (カタログ7語彙 or 自由入力) */
export function expressionLabel(tagId: string): string {
  if (tagId.startsWith(EXPR_FREE_PREFIX)) return tagId.slice(EXPR_FREE_PREFIX.length)
  return EXPRESSION_TAG_BY_ID[tagId]?.label ?? tagId
}
