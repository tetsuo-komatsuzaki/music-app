// =======================================================================
// 練習カテゴリの一元管理 (2026-05-31 練習メニュー再編)
// =======================================================================
// 旧来 scale/arpeggio/etude のラベル・配列が複数ファイルに散在していたため集約。
// 練習メニュー = 基礎練(6カテゴリ) + エチュード。
// 「練習曲」は Score(isShared) 側なので PracticeCategory には含めない。

// 基礎練の6カテゴリ (表示順)
export const BASIC_PRACTICE_CATEGORIES = [
  "scale",
  "arpeggio",
  "fingering",
  "bowing",
  "position_shift",
  "double_stop",
] as const

// PracticeItem.category が取り得る全カテゴリ (基礎練6 + エチュード)
export const PRACTICE_CATEGORIES = [
  ...BASIC_PRACTICE_CATEGORIES,
  "etude",
] as const

export type PracticeCategoryId = (typeof PRACTICE_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<PracticeCategoryId, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  fingering: "フィンガリング",
  bowing: "ボウイング",
  position_shift: "ポジション移動",
  double_stop: "重音",
  etude: "エチュード",
}

// 練習メニュートップのグループ構成 (基礎練はインライン6カード / エチュードは単独)。
// 「練習曲」は Score(isShared) を別セクションで表示するため UI 側で別途扱う。
export const PRACTICE_TOP_GROUPS = [
  { key: "basic", label: "基礎練", categories: BASIC_PRACTICE_CATEGORIES },
  { key: "etude", label: "エチュード", categories: ["etude"] as const },
] as const

export function categoryLabel(cat: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[cat] ?? cat
}

export function isPracticeCategory(cat: string): cat is PracticeCategoryId {
  return (PRACTICE_CATEGORIES as readonly string[]).includes(cat)
}
