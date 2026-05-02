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
