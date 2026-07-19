import { describe, it, expect } from "vitest"
import {
  TASK_IDS,
  TASK_NAMES,
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  SUB_TASKS_FUTURE,
  LIVE_SUB_TASK_IDS,
  SKILL_TASKS,
  AXES,
  GRADE_LEVELS,
  GRADE_NAMES,
} from "./skillMaster"

// 個別課題マスターデータの内部整合性 (intended: 定義は互いに矛盾しない)。
// 弓採点23項目 (LIVE) は bowing_score.py / subtask_judges.py と同期必須なので
// ここが最初の砦になる。

describe("skillMaster: 中項目 (task)", () => {
  it("TASK_IDS は pitch/rhythm/bowing の3種", () => {
    expect([...TASK_IDS]).toEqual(["pitch", "rhythm", "bowing"])
  })
  it("全 TASK_ID に名前が存在する", () => {
    for (const id of TASK_IDS) {
      expect(TASK_NAMES[id]).toBeTruthy()
    }
    expect(Object.keys(TASK_NAMES).sort()).toEqual([...TASK_IDS].sort())
  })
})

describe("skillMaster: 小項目 (sub_task) の整合性", () => {
  it("SUB_TASK_IDS に重複がない", () => {
    expect(new Set(SUB_TASK_IDS).size).toBe(SUB_TASK_IDS.length)
  })

  it("全 SUB_TASK_ID にちょうど1つの名前が定義されている (過不足なし)", () => {
    for (const id of SUB_TASK_IDS) {
      expect(SUB_TASK_NAMES[id], `name missing for ${id}`).toBeTruthy()
    }
    // 名前側に余計なキー (存在しない sub_task) が無いこと
    expect(Object.keys(SUB_TASK_NAMES).sort()).toEqual([...SUB_TASK_IDS].sort())
  })

  it("全 SUB_TASK_ID は既知の中項目プレフィックスを持つ", () => {
    for (const id of SUB_TASK_IDS) {
      const prefix = id.split("_")[0]
      expect(TASK_IDS as readonly string[]).toContain(prefix)
    }
  })
})

describe("skillMaster: SKILL_TASKS グルーピング", () => {
  it("各中項目の subTaskIds はその中項目プレフィックスの sub_task 全部と一致", () => {
    for (const taskId of TASK_IDS) {
      const expected = SUB_TASK_IDS.filter((s) => s.startsWith(`${taskId}_`))
      expect(SKILL_TASKS[taskId].subTaskIds.sort()).toEqual([...expected].sort())
    }
  })
  it("3中項目の subTaskIds を合わせると SUB_TASK_IDS 全体を過不足なく覆う", () => {
    const union = TASK_IDS.flatMap((t) => SKILL_TASKS[t].subTaskIds)
    expect(new Set(union)).toEqual(new Set(SUB_TASK_IDS))
    expect(union.length).toBe(SUB_TASK_IDS.length) // 重複なく分割
  })
})

describe("skillMaster: AXES (軸) の被覆", () => {
  it("全ての軸の subTaskId は実在する", () => {
    for (const axis of AXES) {
      for (const s of axis.subTaskIds) {
        expect(SUB_TASK_IDS as readonly string[], `axis ${axis.id} has unknown ${s}`).toContain(s)
      }
    }
  })
  it("軸の parentTaskId と軸内 sub_task のプレフィックスが一致", () => {
    for (const axis of AXES) {
      for (const s of axis.subTaskIds) {
        expect(s.startsWith(`${axis.parentTaskId}_`), `${s} not under ${axis.parentTaskId}`).toBe(true)
      }
    }
  })
  it("AXES は全 SUB_TASK_ID をちょうど1軸で覆う (分割・過不足なし)", () => {
    const all = AXES.flatMap((a) => a.subTaskIds)
    expect(new Set(all)).toEqual(new Set(SUB_TASK_IDS))
    // 1つの sub_task が複数軸に属していない
    expect(all.length).toBe(SUB_TASK_IDS.length)
    expect(new Set(all).size).toBe(all.length)
  })
  it("軸ID に重複がない", () => {
    const ids = AXES.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("skillMaster: 集合の部分集合関係", () => {
  it("SUB_TASKS_FUTURE ⊆ SUB_TASK_IDS", () => {
    for (const s of SUB_TASKS_FUTURE) {
      expect(SUB_TASK_IDS as readonly string[]).toContain(s)
    }
  })
  it("LIVE_SUB_TASK_IDS ⊆ SUB_TASK_IDS", () => {
    for (const s of LIVE_SUB_TASK_IDS) {
      expect(SUB_TASK_IDS as readonly string[]).toContain(s)
    }
  })
  it("現役課題 (LIVE) は弓採点23項目 = bowing_ プレフィックスの sub_task 全部と厳密一致 (subtask_judges.py と同期)", () => {
    const bowing = SUB_TASK_IDS.filter((s) => s.startsWith("bowing_"))
    expect(LIVE_SUB_TASK_IDS.size).toBe(23)
    expect([...LIVE_SUB_TASK_IDS].sort()).toEqual([...bowing].sort())
  })
})

describe("skillMaster: グレード", () => {
  it("GRADE_LEVELS は4段階で全て名前を持つ", () => {
    expect([...GRADE_LEVELS]).toEqual(["BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER"])
    for (const g of GRADE_LEVELS) expect(GRADE_NAMES[g]).toBeTruthy()
    expect(Object.keys(GRADE_NAMES).sort()).toEqual([...GRADE_LEVELS].sort())
  })
})
