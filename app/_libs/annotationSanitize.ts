// 譜面注釈のサーバー側サニタイズ (2026-08-08 テスト調査 Wave9)。
// クライアントは40字上限/固定リストで守っているが、Server Action を直接叩かれても
// DB が肥大化しないよう件数・長さ・型を強制する。不正な要素は捨てる (throw しない)。
// "use server" ファイルは async しか export できないため純関数はここに分離。

export type AnnotationData = {
  highlight?: Array<{ fromNote: number; toNote: number; color?: string }>
  warnings?: Array<{ noteIndex: number; dy?: number; kind: string; text?: string }>
  notation?: Array<{ noteIndex: number; kind: string; value?: string }>
  // Phase 3 (2026-08-10): 範囲スパナ (slur/cresc/decresc/gliss)。音符 from→to をまたぐ記号。
  spans?: Array<{ fromNote: number; toNote: number; kind: string }>
}

const MAX_ITEMS = 500 // 各配列の最大件数 (1曲の音符数を大きく超えない範囲)

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null
const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" ? v.slice(0, max) : undefined

export function sanitizeAnnotationData(d: AnnotationData): AnnotationData {
  const out: AnnotationData = {}
  if (Array.isArray(d.highlight)) {
    out.highlight = d.highlight.slice(0, MAX_ITEMS).flatMap((h) => {
      const from = num(h?.fromNote), to = num(h?.toNote)
      // 色は24字上限: rgba(255,213,74,.46)=20字 / var(--text-error)=17字 を切らずに通す (CSS注入の間口は絞る)
      return from == null || to == null ? [] : [{ fromNote: from, toNote: to, color: str(h?.color, 24) }]
    })
  }
  if (Array.isArray(d.warnings)) {
    out.warnings = d.warnings.slice(0, MAX_ITEMS).flatMap((w) => {
      const i = num(w?.noteIndex), kind = str(w?.kind, 24)
      return i == null || !kind ? [] : [{ noteIndex: i, dy: num(w?.dy) ?? undefined, kind, text: str(w?.text, 40) }]
    })
  }
  if (Array.isArray(d.notation)) {
    out.notation = d.notation.slice(0, MAX_ITEMS).flatMap((n) => {
      const i = num(n?.noteIndex), kind = str(n?.kind, 24)
      return i == null || !kind ? [] : [{ noteIndex: i, kind, value: str(n?.value, 8) }]
    })
  }
  if (Array.isArray(d.spans)) {
    out.spans = d.spans.slice(0, MAX_ITEMS).flatMap((s) => {
      const from = num(s?.fromNote), to = num(s?.toNote), kind = str(s?.kind, 12)
      return from == null || to == null || !kind ? [] : [{ fromNote: from, toNote: to, kind }]
    })
  }
  return out
}
