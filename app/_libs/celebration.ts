// 祝い体験(マイルストーン祝賀) v2.0 — 表示ロジックの中核 (2026-07-26 celebrationdesign_v2_0.md)。
// prisma 非依存(クライアントからも import 可)。純関数のみ。
// milestone イベントは Python が analysisSummary.milestone に ID照合方式で保存する(§4)。
// 自己ベスト(personal_best)はフロントで合成して同じ器に流す。

export type Tier = "epic" | "major" | "medium" | "minor"
export type Tone = "child" | "adult"

/** 祝賀イベント(発生源を問わない共通形)。§4.3 の型付きイベント配列の1要素。 */
export type MilestoneEvent = {
  type: string
  tier?: Tier // 省略時は CELEBRATION_SPEC の既定を使う
  subject?: { kind: string; id: string }
  payload?: Record<string, unknown>
}

export type CelebrationSpec = {
  tier: Tier
  theme: string // 色テーマ (緑/金/紫/青/ティール)
  arcoPose: string // ArcoChan のポーズ系統
  motion: "takeover" | "card" // 全画面 or 中カード
  keepsake: boolean // 記念カードを残すか
  copy: Record<Tone, { title: string; sub: string }>
}

// 型ごとの見た目・文言・演出のレジストリ。新しい節目はここに1行足すだけ(§10)。
export const CELEBRATION_SPEC: Record<string, CelebrationSpec> = {
  rank_up: {
    tier: "epic", theme: "purple", arcoPose: "称賛", motion: "takeover", keepsake: true,
    copy: {
      child: { title: "ランクアップ！", sub: "あたらしいステージへ！" },
      adult: { title: "ランクアップ", sub: "同じ★の曲を10曲マスター。次の段階へ。" },
    },
  },
  master: {
    tier: "major", theme: "gold", arcoPose: "称賛", motion: "takeover", keepsake: true,
    copy: {
      child: { title: "マスター達成！", sub: "この曲、もう自分のもの。" },
      adult: { title: "マスター", sub: "直近5回の平均90点以上。安定して弾けています。" },
    },
  },
  achieve: {
    tier: "major", theme: "green", arcoPose: "喜び", motion: "takeover", keepsake: true,
    copy: {
      child: { title: "この曲、弾けるようになった！", sub: "達成おめでとう。ここまでよく続けたね。" },
      adult: { title: "達成", sub: "この曲を弾けるように。着実な前進です。" },
    },
  },
  material_clear: {
    tier: "medium", theme: "teal", arcoPose: "喜び", motion: "card", keepsake: false,
    copy: {
      child: { title: "課題クリア！", sub: "達成に一歩前進！" },
      adult: { title: "課題クリア", sub: "この教材、直近5回の平均90点以上に到達。" },
    },
  },
  personal_best: {
    tier: "medium", theme: "blue", arcoPose: "喜び", motion: "card", keepsake: false,
    copy: {
      child: { title: "自己ベスト更新！", sub: "前よりうまくなってる！" },
      adult: { title: "自己ベスト更新", sub: "過去最高を更新しました。" },
    },
  },
}

const TIER_ORDER: Record<Tier, number> = { epic: 4, major: 3, medium: 2, minor: 1 }
// tier同格のtie-break: master > achieve (§10)。値が大きいほど優先。未定義は0。
const TYPE_PRIORITY: Record<string, number> = { master: 2, achieve: 1 }

/** 表示するお祝いの選定結果。 */
export type SelectedCelebrations = {
  /** 本体(最上位1つ) */
  primary: MilestoneEvent | null
  /** 昇格系(rank_up)は本体の後の2段目 */
  secondary: MilestoneEvent | null
  /** 自己ベストが本体(major以上)に吸収されたか(本体カード内に「自己ベストも更新」表記) */
  absorbedBest: boolean
}

const specTier = (e: MilestoneEvent): Tier => e.tier ?? CELEBRATION_SPEC[e.type]?.tier ?? "minor"

/**
 * イベント配列から表示するお祝いを選ぶ(§10 重なり規則)。
 * - CELEBRATION_SPEC 未登録の type は無視(未知type安全無視)
 * - tier 降順で最上位を本体に。tier同格は master > achieve
 * - rank_up は「2段目」(本体の後)
 * - personal_best は major以上と同時なら本体に吸収(単独なら本体=medium)
 * 純関数・テスト対象。
 */
export function selectCelebrations(events: MilestoneEvent[]): SelectedCelebrations {
  const known = events.filter((e) => CELEBRATION_SPEC[e.type])
  const rankUp = known.find((e) => e.type === "rank_up") ?? null
  const others = known.filter((e) => e.type !== "rank_up")
  const hasBest = others.some((e) => e.type === "personal_best")
  const nonBest = others.filter((e) => e.type !== "personal_best")

  let primary: MilestoneEvent | null = null
  if (nonBest.length > 0) {
    primary = nonBest.slice().sort((a, b) =>
      TIER_ORDER[specTier(b)] - TIER_ORDER[specTier(a)] ||
      (TYPE_PRIORITY[b.type] ?? 0) - (TYPE_PRIORITY[a.type] ?? 0) ||
      a.type.localeCompare(b.type),
    )[0]
  } else if (hasBest) {
    primary = others.find((e) => e.type === "personal_best") ?? null
  }

  // rank_up 単独(本体無し)の異常系は rank_up を本体に昇格
  if (!primary && rankUp) {
    return { primary: rankUp, secondary: null, absorbedBest: false }
  }

  const secondary = primary && primary.type !== "rank_up" ? rankUp : null
  const absorbedBest = hasBest && primary != null && primary.type !== "personal_best"
  return { primary, secondary, absorbedBest }
}

/** analysisSummary.milestone を安全にパースしてイベント配列を返す(§4.3)。未定義/壊れは空。 */
export function parseMilestoneEvents(analysisSummary: unknown): MilestoneEvent[] {
  if (!analysisSummary || typeof analysisSummary !== "object") return []
  const m = (analysisSummary as Record<string, unknown>).milestone
  if (!m || typeof m !== "object") return []
  const events = (m as Record<string, unknown>).events
  if (!Array.isArray(events)) return []
  const out: MilestoneEvent[] = []
  for (const e of events) {
    if (!e || typeof e !== "object") continue
    const type = (e as Record<string, unknown>).type
    if (typeof type !== "string") continue
    const ev = e as { type: string; tier?: Tier; subject?: MilestoneEvent["subject"]; payload?: MilestoneEvent["payload"] }
    out.push({ type: ev.type, tier: ev.tier, subject: ev.subject, payload: ev.payload })
  }
  return out
}

/** バナー用の曲名/教材名の省略(§2.1: 全角12〜15文字で「…」省略)。 */
