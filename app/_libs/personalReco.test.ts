/**
 * personalReco.test.ts — ホームのおすすめエンジン (2026-09-04 確定規則)。
 *
 * 検査するのは規則そのもの:
 *   ① タブの振り分け
 *   ② 一番低い1件を選ぶ (同率は判定音の多い方)
 *   ③ 足切り未満は候補にしない
 *   ④ 教材はユーザーの★以下から、出現回数が最多の1件
 *   ⑤ 全部低いタブは basics=true
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

type Counter = { skillSubTaskId: string; matchedCount: number; totalCount: number }
type CountRow = {
  count: number
  practiceItem: {
    id: string; title: string; category: string
    star: number | null; keyTonic: string; keyMode: string
  }
}

const state: {
  counters: Counter[]
  star: number | null
  rows: (CountRow & { subtaskId: string })[]
} = { counters: [], star: 3, rows: [] }

vi.mock("./prisma", () => ({
  prisma: {
    userSkillSubScore: {
      findMany: async () => state.counters,
    },
    userStarProgress: {
      findUnique: async () => (state.star === null ? null : { currentStar: state.star }),
    },
    performance: { findFirst: async () => null },
    practiceItemSubtaskCount: {
      findFirst: async ({ where }: { where: { subtaskId: string; practiceItem: { star: { lte: number } } } }) => {
        const hit = state.rows
          .filter((r) => r.subtaskId === where.subtaskId)
          .filter((r) => (r.practiceItem.star ?? 99) <= where.practiceItem.star.lte)
          .sort((a, b) => b.count - a.count)
        return hit[0] ?? null
      },
    },
  },
}))

const mat = (id: string, star: number | null) => ({
  id, title: `教材${id}`, category: "etude", star, keyTonic: "G", keyMode: "major",
})

beforeEach(() => {
  state.counters = []
  state.star = 3
  state.rows = []
})

async function build() {
  const { buildPersonalReco } = await import("./personalReco")
  return buildPersonalReco("u1")
}
const tab = (r: Awaited<ReturnType<typeof build>>, k: string) =>
  r!.tabs.find((t) => t.key === k)!

describe("personalReco", () => {
  it("カウンタが無ければ枠ごと出さない", async () => {
    expect(await build()).toBeNull()
  })

  it("課題をタブへ振り分ける", async () => {
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 5, totalCount: 20 },
      { skillSubTaskId: "pitch_posshift_1_3", matchedCount: 5, totalCount: 20 },
      { skillSubTaskId: "pitch_tech_slur", matchedCount: 5, totalCount: 20 },
      // リズムの木は同じ課題の別観点なので、このカードでは使わない
      { skillSubTaskId: "rhythm_interval_same_up_leap", matchedCount: 19, totalCount: 20 },
    ]
    const r = await build()
    expect(tab(r, "pitch").focus?.name).toBe("同じ弦で高い音へ大きく跳ぶ")
    expect(tab(r, "position").focus?.name).toBe("左手を第1から第3ポジションへ移す")
    expect(tab(r, "technique").focus?.name).toBe("スラーのところ")
    expect(tab(r, "fingering").focus).toBeNull()
  })

  it("一番低い1件を選ぶ", async () => {
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 2, totalCount: 20 },   // 90%
      { skillSubTaskId: "pitch_interval_same_down_leap", matchedCount: 8, totalCount: 20 }, // 60%
      { skillSubTaskId: "pitch_interval_adj_up_leap", matchedCount: 5, totalCount: 20 },    // 75%
    ]
    const f = tab(await build(), "pitch").focus!
    expect(f.name).toBe("同じ弦で低い音へ大きく跳ぶ")
    expect(f.successPct).toBe(60)
  })

  it("同率なら判定音の多い方を選ぶ", async () => {
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 5, totalCount: 20 },
      { skillSubTaskId: "pitch_interval_same_down_leap", matchedCount: 50, totalCount: 200 },
    ]
    expect(tab(await build(), "pitch").focus?.name).toBe("同じ弦で低い音へ大きく跳ぶ")
  })

  it("判定音が足切り未満なら候補にしない", async () => {
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 8, totalCount: 9 },
    ]
    expect(await build()).toBeNull()
  })

  it("診断対象でない課題は候補にしない", async () => {
    // 同じ弦で少しだけ動くのは「変化なし箱」
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_step", matchedCount: 19, totalCount: 100 },
    ]
    expect(await build()).toBeNull()
  })

  it("教材は★以下から出現回数が最多の1件", async () => {
    state.star = 3
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 5, totalCount: 20 },
    ]
    state.rows = [
      { subtaskId: "pitch_interval_same_up_leap", count: 999, practiceItem: mat("over", 5) },
      { subtaskId: "pitch_interval_same_up_leap", count: 30, practiceItem: mat("few", 3) },
      { subtaskId: "pitch_interval_same_up_leap", count: 80, practiceItem: mat("many", 2) },
    ]
    const t = tab(await build(), "pitch")
    expect(t.materials.map((m) => m.id)).toEqual(["many"])
  })

  it("★以下に候補が無ければ教材なし", async () => {
    state.star = 1
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 5, totalCount: 20 },
    ]
    state.rows = [
      { subtaskId: "pitch_interval_same_up_leap", count: 999, practiceItem: mat("over", 5) },
    ]
    expect(tab(await build(), "pitch").materials).toEqual([])
  })

  it("そのタブの課題がどれも低ければ basics=true", async () => {
    state.counters = [
      { skillSubTaskId: "pitch_interval_same_up_leap", matchedCount: 60, totalCount: 100 },   // 40%
      { skillSubTaskId: "pitch_interval_same_down_leap", matchedCount: 70, totalCount: 100 }, // 30%
      { skillSubTaskId: "pitch_posshift_1_3", matchedCount: 10, totalCount: 100 },            // 90%
    ]
    const r = await build()
    expect(tab(r, "pitch").basics).toBe(true)
    expect(tab(r, "position").basics).toBe(false)
  })
})
