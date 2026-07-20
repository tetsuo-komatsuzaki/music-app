// 通常技法パターン (Phase 1, 2026-07-20): 全音符に一律適用する6奏法。
// music21 記譜マッピングは analyze_musicxml.py 側 (レガート=Tenuto, マルテレ=Marcato/StrongAccent,
// トレモロ=expressions.Tremolo(marks=2), ポルタート=DetachedLegato)。
// 対象カテゴリ: 音階/アルペジオ/ボーイング/フィンガリング/ポジション移動。

export type ArticulationId = "legato" | "staccato" | "spiccato" | "martele" | "portato" | "tremolo"

export const STANDARD_ARTICULATIONS: { id: ArticulationId; label: string }[] = [
  { id: "legato", label: "レガート" },
  { id: "staccato", label: "スタッカート" },
  { id: "spiccato", label: "スピッカート" },
  { id: "martele", label: "マルテレ" },
  { id: "portato", label: "ポルタート" },
  { id: "tremolo", label: "トレモロ" },
]

/** 通常技法パターンの対象カテゴリ */
export const ARTICULATION_CATEGORIES = ["scale", "arpeggio", "bowing", "fingering", "position_shift"]

// 奏法 → 弓の課題タグ(skillSubTaskTags)。現役=弓サブタスクのみ (skillMaster LIVE_SUB_TASK_IDS)。
// マルテレ/レガートは対応サブタスクが無いため付与しない。音程/リズムの課題は217診断が自動で担う。
export const ARTICULATION_SUBTASK: Partial<Record<ArticulationId, string>> = {
  staccato: "bowing_technique_staccato",
  spiccato: "bowing_technique_spiccato",
  tremolo: "bowing_technique_tremolo",
  portato: "bowing_technique_portato",
}
