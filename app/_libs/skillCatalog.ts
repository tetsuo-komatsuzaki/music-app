// わざの軽量カタログ (2026-08-11)。クライアントからも安全にimportできる単一ソース。
// growthKarte.ts の SKILL_DEFS と id/label/lane を同期すること (フル定義はあちらが正)。
export type SkillIdLabel = { id: string; label: string; lane: "bow" | "left" }
export const SKILL_ID_LABELS: SkillIdLabel[] = [
  { id: "slur", label: "スラー", lane: "bow" },
  { id: "staccato", label: "スタッカート", lane: "bow" },
  { id: "portato", label: "ポルタート", lane: "bow" },
  { id: "bow_staccato", label: "連続スタッカート", lane: "bow" },
  { id: "tremolo", label: "トレモロ", lane: "bow" },
  { id: "pizzicato", label: "ピチカート", lane: "bow" },
  { id: "spiccato", label: "スピッカート", lane: "bow" },
  { id: "ricochet", label: "リコシェ", lane: "bow" },
  { id: "position", label: "ポジション移動", lane: "left" },
  { id: "double", label: "重音", lane: "left" },
  { id: "trill", label: "トリル", lane: "left" },
  { id: "mordent", label: "プラルトリラーとモルデント", lane: "left" },
  { id: "vibrato", label: "ビブラート", lane: "left" },
  { id: "glissando", label: "グリッサンド", lane: "left" },
  { id: "harmonic", label: "ハーモニクス", lane: "left" },
]
