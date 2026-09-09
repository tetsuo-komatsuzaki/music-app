/**
 * 5 つの力 ・ 素の部分 (2026-09-06)。画面 (クライアント) からも読むので、DB を触る部品はここに置かない
 * (置くと pg が画面側に束ねられて落ちる)。集計は fivePowers.ts (サーバー)。
 *
 * 規則 (Tetsuo 2026-09-06):
 *   - 先週の自分 = 直近 7 日 と その前の 7 日。先月の自分 = 直近 30 日 と その前の 30 日。はじめの自分 = 直近 30 日 と 最初の 5 回の演奏。
 *   - 相手の期間に録音が無ければ「先週は録音なし」(相手の線は描かない)。
 *   - どちらかで測れない軸は、いま も 相手 も 0 に落とす (主語は「いまの自分」との比較なので)。軸名の横に「録音なし」。
 */
export type PowerKey = "pitch" | "rhythm" | "fast" | "position" | "technique"
export const POWER_KEYS: PowerKey[] = ["pitch", "rhythm", "fast", "position", "technique"]
export const POWER_LABEL: Record<PowerKey, string> = { pitch: "音程", rhythm: "リズム", fast: "速い指", position: "ポジション", technique: "奏法" }
/** 力 → 効く教材の棚 (practiceBase からの相対) */
export const POWER_PRACTICE: Record<PowerKey, string> = { pitch: "/scale", rhythm: "", fast: "/fingering", position: "/position_shift", technique: "/etude" }

/** 軸が測れたとみなす最少の音数 */
export const MIN_NOTES = 10

export type FivePowers = {
  /** 0〜100。測れなければ null */
  values: Record<PowerKey, number | null>
  /** 判定に使った音数 */
  notes: Record<PowerKey, number>
  perfCount: number
}

export const EMPTY_POWERS: FivePowers = {
  values: { pitch: null, rhythm: null, fast: null, position: null, technique: null },
  notes: { pitch: 0, rhythm: 0, fast: 0, position: 0, technique: 0 },
  perfCount: 0,
}

export type CompareScale = "w" | "m" | "f"
export const SCALE_LABEL: Record<CompareScale, { seg: string; past: string; now: string; period: "7d" | "30d" }> = {
  w: { seg: "先週の自分と", past: "先週", now: "今週", period: "7d" },
  m: { seg: "先月の自分と", past: "先月", now: "この30日", period: "30d" },
  f: { seg: "はじめの自分と", past: "はじめの5回", now: "この30日", period: "30d" },
}
export function parseScale(raw: string | undefined | null): CompareScale {
  return raw === "m" || raw === "f" ? raw : "w"
}

/** いま と 相手 の窓。until は含まない */
export function scaleWindows(scale: CompareScale, now = new Date()): { now: { since: Date; until: Date }; past: { since: Date; until: Date } | { firstN: number } } {
  const d = 864e5
  if (scale === "w") return { now: { since: new Date(now.getTime() - 7 * d), until: now }, past: { since: new Date(now.getTime() - 14 * d), until: new Date(now.getTime() - 7 * d) } }
  if (scale === "m") return { now: { since: new Date(now.getTime() - 30 * d), until: now }, past: { since: new Date(now.getTime() - 60 * d), until: new Date(now.getTime() - 30 * d) } }
  return { now: { since: new Date(now.getTime() - 30 * d), until: now }, past: { firstN: 5 } }
}

export type PowersComparison = {
  scale: CompareScale
  now: FivePowers
  /** 相手。録音が無ければ null (「先週は録音なし」) */
  past: FivePowers | null
  /** 描画用: 測れない軸は両方 0。missing = 「録音なし」を添える軸 */
  chart: { now: Record<PowerKey, number>; past: Record<PowerKey, number> | null; missing: PowerKey[] }
  conclusion: { text: string; weakest: PowerKey | null; best: PowerKey | null }
}

/** いま と 相手 から描画用の値と結論を作る。純粋 */
export function comparePowers(scale: CompareScale, now: FivePowers, past: FivePowers | null): PowersComparison {
  const hasPast = past != null && past.perfCount > 0
  const missing: PowerKey[] = []
  const cn = {} as Record<PowerKey, number>
  const cp = {} as Record<PowerKey, number>
  for (const k of POWER_KEYS) {
    const a = now.values[k], b = hasPast ? past!.values[k] : null
    // どちらかで測れない軸は両方 0 (Tetsuo 2026-09-06)。相手が無い尺度では いま だけで判定
    const measured = a != null && (!hasPast || b != null)
    if (!measured) missing.push(k)
    cn[k] = measured ? a! : 0
    cp[k] = measured ? (b ?? 0) : 0
  }
  const measuredKeys = POWER_KEYS.filter((k) => !missing.includes(k))
  const L = SCALE_LABEL[scale]
  let best: PowerKey | null = null, weakest: PowerKey | null = null
  let text: string
  if (measuredKeys.length === 0) {
    text = `${L.now}はまだ判定できる録音が少ないよ。曲か基礎練を録音すると 5 つの力が出るよ。`
  } else if (!hasPast) {
    weakest = measuredKeys.reduce((m, k) => (cn[k] < cn[m] ? k : m), measuredKeys[0])
    best = measuredKeys.reduce((m, k) => (cn[k] > cn[m] ? k : m), measuredKeys[0])
    text = `${L.past}は録音なし。${L.now}は ${POWER_LABEL[best]} が ${cn[best]}% でいちばん高く、${POWER_LABEL[weakest]} が ${cn[weakest]}% でいちばん低い。`
  } else {
    const delta = (k: PowerKey) => cn[k] - cp[k]
    const up = measuredKeys.filter((k) => delta(k) > 0).sort((a, b) => delta(b) - delta(a))
    const down = measuredKeys.filter((k) => delta(k) < 0).sort((a, b) => delta(a) - delta(b))
    best = up[0] ?? null
    weakest = down[0] ?? measuredKeys.reduce((m, k) => (cn[k] < cn[m] ? k : m), measuredKeys[0])
    const parts: string[] = []
    if (best) parts.push(`${POWER_LABEL[best]} が${L.past}より伸びた (+${delta(best)})`)
    if (down[0]) parts.push(`${POWER_LABEL[down[0]]} が下がった (${delta(down[0])})`)
    else parts.push(`いちばん低いのは ${POWER_LABEL[weakest]} (${cn[weakest]}%)`)
    if (!best && !down[0]) parts.unshift(`${L.past}と同じ形`)
    text = parts.join("。") + "。"
  }
  return { scale, now, past: hasPast ? past : null, chart: { now: cn, past: hasPast ? cp : null, missing }, conclusion: { text, weakest, best } }
}
