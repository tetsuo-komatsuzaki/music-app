import { describe, it, expect, vi, beforeEach } from "vitest"
import type {
  MaterialCandidate,
  DiagnosisJson,
  RecommendContext,
} from "./weaknessRecommendation"

// weaknessRecommendation.ts の純粋部（matchesQuery / rankScore / selectMaterials /
// position 前提条件）は module-private。公開 API recommendForPerformance /
// recommendCumulative 経由で検証する。在庫キャッシュは module-level のため、
// テスト毎に vi.resetModules() で作り直す。

// ── prisma モック（factory は reset 後に再評価され fresh な vi.fn を返す） ──
vi.mock("./prisma", () => ({
  prisma: {
    practiceItem: { findMany: vi.fn() },
    userSkillSubScore: { findMany: vi.fn() },
    userStarProgress: { findUnique: vi.fn() },
    performance: { findFirst: vi.fn() },
  },
}))

// prisma row（getInventory の select 形）を組み立てる
function invRow(o: {
  id: string
  category: string
  star?: number | null
  keyTonic?: string
  keyMode?: string
  tempoMin?: number | null
  tempoMax?: number | null
  positions?: string[]
  features?: Array<{ category: string; name: string }>
  techniques?: string[]
}) {
  return {
    id: o.id,
    title: o.id,
    category: o.category,
    star: o.star ?? null,
    keyTonic: o.keyTonic ?? "C",
    keyMode: o.keyMode ?? "major",
    tempoMin: o.tempoMin ?? null,
    tempoMax: o.tempoMax ?? null,
    positions: o.positions ?? [],
    featureTags: (o.features ?? []).map((f) => ({ featureTag: f })),
    techniques: (o.techniques ?? []).map((n) => ({ techniqueTag: { name: n } })),
  }
}

function diag(
  pitch: string[],
  rhythm: string[],
  per_subtask: Record<string, { miss: number; target: number }> = {}
): DiagnosisJson {
  return { version: 2, map_available: true, per_subtask, diagnosis: { pitch, rhythm } }
}

const baseCtx: RecommendContext = {
  star: null,
  keyTonic: null,
  keyMode: null,
  tempo: null,
  positions: null,
}

/** reset modules → 在庫行を仕込む → fresh モジュールを import */
async function loadPerf(rows: ReturnType<typeof invRow>[]) {
  vi.resetModules()
  const p = await import("./prisma")
  ;(p.prisma.practiceItem.findMany as any).mockResolvedValue(rows)
  const mod = await import("./weaknessRecommendation")
  return { mod, prisma: p.prisma }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════
describe("recommendForPerformance — マッチング (matchesQuery)", () => {
  it("technique クエリは技術タグ一致の教材だけを拾う", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "slurItem", category: "etude", techniques: ["スラー"] }),
      invRow({ id: "other", category: "etude", techniques: ["トリル"] }),
      invRow({ id: "noTag", category: "scale" }),
    ])
    const slots = await mod.recommendForPerformance(diag(["pitch_tech_slur"], []), baseCtx)
    expect(slots).toHaveLength(1)
    expect(slots[0].materials.map((m) => m.id)).toEqual(["slurItem"])
    expect(slots[0].noStock).toBe(false)
  })

  it("feature クエリ優先: 先頭条件がヒットしたら後続 category へ落ちない", async () => {
    // pitch_double_third_single: [feature double_stop/3度, category double_stop]
    const { mod } = await loadPerf([
      invRow({
        id: "featHit",
        category: "double_stop",
        features: [{ category: "double_stop", name: "3度" }],
      }),
      invRow({ id: "catOnly", category: "double_stop" }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_double_third_single"], []),
      baseCtx
    )
    // 先頭 feature クエリで featHit がヒット → catOnly は採用されない
    expect(slots[0].materials.map((m) => m.id)).toEqual(["featHit"])
  })

  it("feature 在庫0なら次点 category クエリにフォールバック", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "catOnly", category: "double_stop" }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_double_third_single"], []),
      baseCtx
    )
    expect(slots[0].materials.map((m) => m.id)).toEqual(["catOnly"])
  })

  // 2026-09-04: whole/half/quarter の条件は basic (=音階) をやめた。音階は
  // 毎日の基礎練で別枠に出す判断 (2026-07-25) で在庫から外れており、条件だけが
  // 取り残されて恒久的に0件だったため。いまは弓/アルペジオ/フィンガリングを引く。
  it("全音符のリズムは弓の教材を引く（音階は在庫から外れているので使わない）", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "scaleA", category: "scale" }),
      invRow({ id: "bowA", category: "bowing" }),
    ])
    const slots = await mod.recommendForPerformance(diag([], ["rhythm_value_whole"]), baseCtx)
    expect(slots[0].materials.map((m) => m.id)).toEqual(["bowA"])
  })

  it("在庫が無ければ noStock=true・materials 空", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "x", category: "etude", techniques: ["トリル"] }),
    ])
    const slots = await mod.recommendForPerformance(diag(["pitch_tech_slur"], []), baseCtx)
    expect(slots[0].materials).toEqual([])
    expect(slots[0].noStock).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════
describe("recommendForPerformance — 順位付け (rankScore)", () => {
  it("① star が基準に近い教材を優先し、上位 MATERIALS_PER_SLOT(=2) だけ返す", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "s6", category: "etude", star: 6, techniques: ["スラー"] }),
      invRow({ id: "s3", category: "etude", star: 3, techniques: ["スラー"] }),
      invRow({ id: "s4", category: "etude", star: 4, techniques: ["スラー"] }),
    ])
    const ctx = { ...baseCtx, star: 3 }
    const slots = await mod.recommendForPerformance(diag(["pitch_tech_slur"], []), ctx)
    // star距離 0,1,3 → s3, s4 が上位2。s6 は切られる
    expect(slots[0].materials.map((m) => m.id)).toEqual(["s3", "s4"])
  })

  it("star=null の教材は距離ペナルティ(=5)で後ろに回る", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "sNull", category: "etude", star: null, techniques: ["スラー"] }),
      invRow({ id: "s3", category: "etude", star: 3, techniques: ["スラー"] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], []),
      { ...baseCtx, star: 3 }
    )
    expect(slots[0].materials[0].id).toBe("s3")
  })

  it("② star 同点なら調一致を優先", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "keyG", category: "etude", star: 3, keyTonic: "G", techniques: ["スラー"] }),
      invRow({ id: "keyD", category: "etude", star: 3, keyTonic: "D", techniques: ["スラー"] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], []),
      { ...baseCtx, star: 3, keyTonic: "G", keyMode: "major" }
    )
    expect(slots[0].materials.map((m) => m.id)).toEqual(["keyG", "keyD"])
  })

  it("③ star・調 同点ならテンポが近い教材を優先", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "far", category: "etude", star: 3, tempoMin: 150, tempoMax: 160, techniques: ["スラー"] }),
      invRow({ id: "near", category: "etude", star: 3, tempoMin: 90, tempoMax: 110, techniques: ["スラー"] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], []),
      { ...baseCtx, star: 3, tempo: 100 }
    )
    // near は範囲内(距離0)、far は 50/200=0.25 → near 優先
    expect(slots[0].materials.map((m) => m.id)).toEqual(["near", "far"])
  })
})

// ═══════════════════════════════════════════════════════════════════════
describe("recommendForPerformance — ポジション前提条件", () => {
  it("ctx.positions 内で弾ける教材に絞る（範囲外は除外・空positionは常に許可）", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "p1", category: "etude", positions: ["1st"], features: [{ category: "position", name: "2ndポジション" }] }),
      invRow({ id: "p3", category: "etude", positions: ["3rd"], features: [{ category: "position", name: "2ndポジション" }] }),
      invRow({ id: "pEmpty", category: "etude", positions: [], features: [{ category: "position", name: "2ndポジション" }] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_posshift_1_2"], []),
      { ...baseCtx, positions: [1] }
    )
    const ids = slots[0].materials.map((m) => m.id)
    expect(ids).toContain("p1")
    expect(ids).toContain("pEmpty")
    expect(ids).not.toContain("p3")
  })

  it("前提で0件になったら緩めて全候補に戻す（空推薦より優先）", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "p1", category: "etude", positions: ["1st"], features: [{ category: "position", name: "2ndポジション" }] }),
      invRow({ id: "p3", category: "etude", positions: ["3rd"], features: [{ category: "position", name: "2ndポジション" }] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_posshift_1_2"], []),
      { ...baseCtx, positions: [7] } // どの教材ポジションも許可外
    )
    // 0件 → 緩めて両方返す
    expect(slots[0].materials.map((m) => m.id).sort()).toEqual(["p1", "p3"])
  })
})

// ═══════════════════════════════════════════════════════════════════════
describe("recommendForPerformance — スロット間の重複排除と スキップ規則", () => {
  it("同一教材はスロット間で重複しない（次点繰り上げ／2番目は noStock）", async () => {
    // 1教材が スラー・スタッカート 両方の技術を持つ
    const { mod } = await loadPerf([
      invRow({ id: "multi", category: "etude", techniques: ["スラー", "スタッカート"] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur", "pitch_tech_staccato"], []),
      baseCtx
    )
    expect(slots[0].materials.map((m) => m.id)).toEqual(["multi"])
    // 2スロット目は multi が使用済 → 空
    expect(slots[1].materials).toEqual([])
    expect(slots[1].noStock).toBe(true)
  })

  it("diagnosable=false の小課題（変化なし箱）はスロット化しない", async () => {
    const { mod } = await loadPerf([invRow({ id: "any", category: "position_shift" })])
    // pitch_posshift_1_1 は diagnosable:false
    const slots = await mod.recommendForPerformance(diag(["pitch_posshift_1_1"], []), baseCtx)
    expect(slots).toHaveLength(0)
  })

  it("未知の小課題ID は無視する", async () => {
    const { mod } = await loadPerf([])
    const slots = await mod.recommendForPerformance(diag(["___nope___"], []), baseCtx)
    expect(slots).toHaveLength(0)
  })

  it("excludeSubtask フックで除外できる", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "slurItem", category: "etude", techniques: ["スラー"] }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], []),
      baseCtx,
      (sid) => sid === "pitch_tech_slur"
    )
    expect(slots).toHaveLength(0)
  })

  it("missRate = miss/target、target=0 なら 0", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "slurItem", category: "etude", techniques: ["スラー"] }),
      invRow({ id: "scaleA", category: "scale" }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], ["rhythm_value_whole"], {
        pitch_tech_slur: { miss: 3, target: 12 },
        rhythm_value_whole: { miss: 0, target: 0 },
      }),
      baseCtx
    )
    const byId = Object.fromEntries(slots.map((s) => [s.subtaskId, s]))
    expect(byId["pitch_tech_slur"].miss).toBe(3)
    expect(byId["pitch_tech_slur"].target).toBe(12)
    expect(byId["pitch_tech_slur"].missRate).toBeCloseTo(0.25)
    expect(byId["rhythm_value_whole"].missRate).toBe(0)
  })

  it("pitch → rhythm の木順でスロットが並ぶ", async () => {
    const { mod } = await loadPerf([
      invRow({ id: "slurItem", category: "etude", techniques: ["スラー"] }),
      invRow({ id: "scaleA", category: "scale" }),
    ])
    const slots = await mod.recommendForPerformance(
      diag(["pitch_tech_slur"], ["rhythm_value_whole"]),
      baseCtx
    )
    expect(slots.map((s) => s.tree)).toEqual(["pitch", "rhythm"])
  })
})

// ═══════════════════════════════════════════════════════════════════════
describe("recommendCumulative — 累積弱点の選出", () => {
  async function loadCumul(opts: {
    subscores: Array<{ skillSubTaskId: string; matchedCount: number; totalCount: number }>
    inventory: ReturnType<typeof invRow>[]
    currentStar?: number | null
    perfStar?: number | null
  }) {
    vi.resetModules()
    const p = await import("./prisma")
    ;(p.prisma.userSkillSubScore.findMany as any).mockResolvedValue(opts.subscores)
    ;(p.prisma.userStarProgress.findUnique as any).mockResolvedValue(
      opts.currentStar == null ? null : { currentStar: opts.currentStar }
    )
    ;(p.prisma.performance.findFirst as any).mockResolvedValue(
      opts.perfStar == null ? null : { score: { star: opts.perfStar } }
    )
    ;(p.prisma.practiceItem.findMany as any).mockResolvedValue(opts.inventory)
    const mod = await import("./weaknessRecommendation")
    return mod
  }

  it("木ごとに ミス率降順で top-2 を選ぶ", async () => {
    const mod = await loadCumul({
      subscores: [
        { skillSubTaskId: "pitch_tech_slur", matchedCount: 8, totalCount: 10 }, // .8
        { skillSubTaskId: "pitch_tech_staccato", matchedCount: 5, totalCount: 10 }, // .5
        { skillSubTaskId: "pitch_tech_spiccato", matchedCount: 9, totalCount: 10 }, // .9
      ],
      inventory: [invRow({ id: "sc", category: "scale" })],
      currentStar: 3,
    })
    const slots = await mod.recommendCumulative("u1")
    const pitch = slots.filter((s) => s.tree === "pitch")
    // .9 spiccato, .8 slur が上位2。staccato(.5) は落ちる
    expect(pitch.map((s) => s.subtaskId)).toEqual(["pitch_tech_spiccato", "pitch_tech_slur"])
  })

  it("totalCount<10 / matchedCount<=0 は足切り", async () => {
    const mod = await loadCumul({
      subscores: [
        { skillSubTaskId: "pitch_tech_slur", matchedCount: 9, totalCount: 9 }, // total<10
        { skillSubTaskId: "pitch_tech_staccato", matchedCount: 0, totalCount: 50 }, // matched<=0
      ],
      inventory: [],
      currentStar: 3,
    })
    const slots = await mod.recommendCumulative("u1")
    expect(slots).toHaveLength(0)
  })

  it("diagnosable=false / v1Active=false / timbre木 はスキップ", async () => {
    const mod = await loadCumul({
      subscores: [
        { skillSubTaskId: "pitch_posshift_1_1", matchedCount: 9, totalCount: 20 }, // diagnosable:false
        { skillSubTaskId: "timbre_tech_slur", matchedCount: 9, totalCount: 20 }, // v1Active:false & timbre
      ],
      inventory: [invRow({ id: "sc", category: "scale" })],
      currentStar: 3,
    })
    const slots = await mod.recommendCumulative("u1")
    expect(slots).toHaveLength(0)
  })

  it("★基準は UserStarProgress.currentStar を優先（順位付けに反映）", async () => {
    const mod = await loadCumul({
      subscores: [{ skillSubTaskId: "pitch_tech_slur", matchedCount: 5, totalCount: 10 }],
      inventory: [
        invRow({ id: "star4", category: "etude", star: 4, techniques: ["スラー"] }),
        invRow({ id: "star1", category: "etude", star: 1, techniques: ["スラー"] }),
      ],
      currentStar: 4,
      perfStar: 1,
    })
    const slots = await mod.recommendCumulative("u1")
    // currentStar=4 が基準 → star4 が近く先頭
    expect(slots[0].materials[0].id).toBe("star4")
  })

  it("UserStarProgress 無しなら演奏実績の最高star にフォールバック", async () => {
    const mod = await loadCumul({
      subscores: [{ skillSubTaskId: "pitch_tech_slur", matchedCount: 5, totalCount: 10 }],
      inventory: [
        invRow({ id: "star4", category: "etude", star: 4, techniques: ["スラー"] }),
        invRow({ id: "star1", category: "etude", star: 1, techniques: ["スラー"] }),
      ],
      currentStar: null,
      perfStar: 1,
    })
    const slots = await mod.recommendCumulative("u1")
    // 実績star=1 が基準 → star1 が近く先頭
    expect(slots[0].materials[0].id).toBe("star1")
  })
})
