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
