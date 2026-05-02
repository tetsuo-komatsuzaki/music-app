/**
 * 音名を日本語表記に変換するユーティリティ。
 * DB の keyTonic は英字 (C, D#, Bb 等) で保存されているが、UI 表示は
 * 日本語の伝統的音階名 (ハ, 嬰ニ, 変ロ 等) で統一する。
 */

const TONIC_JA: Record<string, string> = {
  "C":  "ハ",     "C#": "嬰ハ",   "Db": "変ニ",
  "D":  "ニ",     "D#": "嬰ニ",   "Eb": "変ホ",
  "E":  "ホ",     "F":  "ヘ",     "F#": "嬰ヘ",
  "Gb": "変ト",   "G":  "ト",     "G#": "嬰ト",
  "Ab": "変イ",   "A":  "イ",     "A#": "嬰イ",
  "Bb": "変ロ",   "B":  "ロ",     "Cb": "変ハ",
}

/** 英字音名 (C, F#, Bb 等) を日本語音名 (ハ, 嬰ヘ, 変ロ 等) に変換。未知の値はそのまま返す。 */
export function tonicToJa(tonic: string | null | undefined): string {
  if (!tonic) return ""
  return TONIC_JA[tonic] ?? tonic
}

/** keyMode を日本語ラベルに変換 */
export function modeToJa(mode: string | null | undefined): string {
  switch (mode) {
    case "major":     return "長調"
    case "minor":     return "短調"
    case "chromatic": return "半音階"
    default:          return mode ?? ""
  }
}

/**
 * 音階の日本語表記を組み立てる (例: F# major → "嬰ヘ長調"、Bb minor → "変ロ短調"、F# chromatic → "嬰ヘ 半音階")
 * 半音階のときだけスペース 1 個入れる (慣例)。
 */
export function formatKey(tonic: string | null | undefined, mode: string | null | undefined): string {
  const t = tonicToJa(tonic)
  const m = modeToJa(mode)
  if (!t) return m
  if (mode === "chromatic") return `${t} ${m}`
  return `${t}${m}`
}
