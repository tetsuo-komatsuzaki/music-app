/**
 * 音名・音階表示を整えるユーティリティ。
 * 表記方針: tonic は英字 (F#, Bb, C 等) のまま、mode のみ日本語ラベルに変換。
 *   例: "F# 長調"、"Bb 和声的短音階"、"C 半音階"
 */

/** keyTonic はそのまま返す (英字統一)。null/undefined は空文字。 */
export function tonicToJa(tonic: string | null | undefined): string {
  return tonic ?? ""
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
 * 音階の表記を組み立てる。
 *   F# major     → "F# 長調"
 *   Bb minor     → "Bb 短調"
 *   C  chromatic → "C 半音階"
 *   tonic だけ / mode だけのときも対応。
 */
export function formatKey(tonic: string | null | undefined, mode: string | null | undefined): string {
  const t = tonic ?? ""
  const m = modeToJa(mode)
  if (!t) return m
  if (!m) return t
  return `${t} ${m}`
}

/** 短調 variant ラベル */
const VARIANT_JA: Record<string, string> = {
  harmonic: "和声",
  melodic: "旋律",
  natural: "自然",
}

/**
 * formatKey に variant 情報を含めて表記する。
 *   Bb minor + harmonic → "Bb 短調(和声)"
 *   C  major  + null    → "C 長調"
 *   F# minor + null     → "F# 短調"  (variant 不明時はベースのみ)
 */
export function formatKeyWithVariant(
  tonic: string | null | undefined,
  mode: string | null | undefined,
  variant: string | null | undefined,
): string {
  const base = formatKey(tonic, mode)
  if (mode === "minor" && variant && VARIANT_JA[variant]) {
    return `${base}(${VARIANT_JA[variant]})`
  }
  return base
}

/** Arpeggio 和音種ラベル */
const CHORD_TYPE_JA: Record<string, string> = {
  major_triad: "長和音",
  minor_triad: "短和音",
  augmented:   "増和音",
  dominant7:   "属7和音",
  diminished7: "減7和音",
}

/**
 * Arpeggio 用の調表記。tonic + 和音種ラベル。
 *   A   + major_triad → "A 長和音"
 *   Bb  + diminished7 → "Bb 減7和音"
 *   C#  + dominant7   → "C# 属7和音"
 */
export function formatChordKey(
  tonic: string | null | undefined,
  chordType: string | null | undefined,
): string {
  const t = tonic ?? ""
  const c = chordType && CHORD_TYPE_JA[chordType] ? CHORD_TYPE_JA[chordType] : ""
  if (!t) return c
  if (!c) return t
  return `${t} ${c}`
}
