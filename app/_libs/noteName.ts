/**
 * noteName.ts — 音名の表記ゆれをそろえる (2026-09-05)。
 *
 * 解析データ (analysis.json / comparison の note_name) は music21 の表記で、フラットが "-" になる ("B-3" = シ♭3)。
 * 画面でそのまま出すと「B-3」が「-3」の音に見える (Tetsuo指摘)。読み手のかたち (NoteProfile.pitch1) は "Bb3" 表記。
 *  - normalizeNoteName: "B-3" / "B♭3" / "Bb3" → "Bb3", "C#5" / "C♯5" → "C#5" (内部表記)
 *  - displayNoteName:   "Bb3" → "B♭3", "C#5" → "C♯5" (画面表記)
 */
const RE = /^([A-Ga-g])(-+|b+|♭+|#+|♯+|x)?(-?\d+)$/

export function normalizeNoteName(name: string): string {
  const m = RE.exec(name.trim())
  if (!m) return name
  const letter = m[1].toUpperCase()
  const acc = m[2] ?? ""
  const flats = (acc.match(/[-b♭]/g) ?? []).length
  const sharps = acc === "x" ? 2 : (acc.match(/[#♯]/g) ?? []).length
  return `${letter}${"b".repeat(flats)}${"#".repeat(sharps)}${m[3]}`
}

export function displayNoteName(name: string): string {
  const n = normalizeNoteName(name)
  const m = /^([A-G])(b*|#*)(-?\d+)$/.exec(n)
  if (!m) return name
  return `${m[1]}${m[2].replace(/b/g, "♭").replace(/#/g, "♯")}${m[3]}`
}
