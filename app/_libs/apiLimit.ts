/**
 * API の ?limit= を安全な範囲にクランプする。
 * 無制限 take による DoS / NaN throw を防ぐ (監査バッチA②)。
 */
export function clampLimit(
  raw: string | null,
  opts: { min?: number; max?: number; fallback?: number } = {},
): number {
  const min = opts.min ?? 1
  const max = opts.max ?? 100
  const fallback = opts.fallback ?? 50
  const n = Number(raw ?? String(fallback))
  return Math.min(max, Math.max(min, Number.isFinite(n) && n > 0 ? n : fallback))
}
