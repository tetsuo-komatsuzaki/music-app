// 教材バリアント「パート分け」の中核 (2026-07-26 Tetsuo確定・設計書 material-variant-system-design.md)。
// パート = 曲(MaterialGroup)に持つ「◯小節〜◯小節」の範囲。難易度共通・任意個・任意スポット許容。
// prisma 非依存 (クライアントからも import 可)。実データ(小節→音符の解決)は各Scoreの解析音符を使う。

/** 曲(グループ)に1回だけ定義するパート。範囲(小節)で持つ。難易度に依存しない。 */
export type Part = {
  /** 固定ID (配列indexではない)。Performance.partId が参照し続けるため不変。 */
  id: string
  /** 表示名 (例: サビ / Aメロ / 第1楽章)。自由文字列。 */
  name: string
  /** 開始小節 (1始まり) */
  startMeasure: number
  /** 終了小節 (startMeasure 以上) */
  endMeasure: number
  /** 並び順 */
  order: number
}

/** 小節→音符の解決に使う、Scoreの解析音符の最小情報 */
export type NoteRef = { note_index: number; measure_number: number }

/** MaterialGroup.parts(JSON) を安全にパースし order 昇順で返す。未定義/壊れは空配列。 */
export function parseParts(raw: unknown): Part[] {
  if (!Array.isArray(raw)) return []
  const out: Part[] = []
  for (const r of raw) {
    if (!r || typeof r !== "object") continue
    const o = r as Record<string, unknown>
    const id = typeof o.id === "string" ? o.id : null
    const name = typeof o.name === "string" ? o.name : null
    const startMeasure = typeof o.startMeasure === "number" ? o.startMeasure : null
    const endMeasure = typeof o.endMeasure === "number" ? o.endMeasure : null
    if (id == null || name == null || startMeasure == null || endMeasure == null) continue
    const order = typeof o.order === "number" ? o.order : out.length
    out.push({ id, name, startMeasure, endMeasure, order })
  }
  return out.sort((a, b) => a.order - b.order || a.startMeasure - b.startMeasure)
}

/** 1パートの妥当性検証。問題があればメッセージ、無ければ null。
 *  ※パートは「任意スポット」なので、重なり・隙間・全体未カバーは許容 (エラーにしない)。 */
export function validatePart(part: Part, totalMeasures?: number): string | null {
  if (!part.name.trim()) return "パート名が必要です"
  if (!Number.isInteger(part.startMeasure) || part.startMeasure < 1) return "開始小節は1以上の整数"
  if (!Number.isInteger(part.endMeasure) || part.endMeasure < part.startMeasure) {
    return "終了小節は開始小節以上"
  }
  if (totalMeasures != null && part.endMeasure > totalMeasures) {
    return `終了小節が曲の小節数(${totalMeasures})を超えています`
  }
  return null
}

/** パート集合の検証。IDの重複だけは不可 (Performance.partId の一意参照が壊れるため)。 */
export function validateParts(parts: Part[], totalMeasures?: number): string | null {
  const ids = new Set<string>()
  for (const p of parts) {
    if (ids.has(p.id)) return `パートIDが重複しています: ${p.id}`
    ids.add(p.id)
    const e = validatePart(p, totalMeasures)
    if (e) return `「${p.name || p.id}」: ${e}`
  }
  return null
}

/** パートの小節範囲を、そのScoreの解析音符から音符範囲(rangeFromNote/rangeToNote)に解決する。
 *  範囲内に音符が無ければ null (この難易度では弾く音が無い=解決不能)。
 *  ※難易度は小節番号が揃う前提(Q1確定)。各Scoreの notes で解決するため、アレンジ差は自然に吸収。 */
export function resolvePartToNoteRange(
  part: Pick<Part, "startMeasure" | "endMeasure">,
  notes: readonly { note_index: number; measure_number?: number | null }[],
): { rangeFromNote: number; rangeToNote: number } | null {
  let from = Infinity
  let to = -Infinity
  for (const n of notes) {
    const m = n.measure_number
    if (m == null) continue
    if (m >= part.startMeasure && m <= part.endMeasure) {
      if (n.note_index < from) from = n.note_index
      if (n.note_index > to) to = n.note_index
    }
  }
  if (from === Infinity) return null
  return { rangeFromNote: from, rangeToNote: to }
}
