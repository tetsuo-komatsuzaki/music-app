import { describe, it, expect, vi, beforeEach } from "vitest"

// prisma をモックしてユニオン判定を検証する。
const findMany = {
  userLessonClear: vi.fn(),
  userTagAcquisition: vi.fn(),
  userLessonPlay: vi.fn(),
}
vi.mock("@/app/_libs/prisma", () => ({
  prisma: {
    userLessonClear: { findMany: (...a: unknown[]) => findMany.userLessonClear(...a) },
    userTagAcquisition: { findMany: (...a: unknown[]) => findMany.userTagAcquisition(...a) },
    userLessonPlay: { findMany: (...a: unknown[]) => findMany.userLessonPlay(...a) },
    practiceItem: { findMany: vi.fn() },
  },
}))

import { tagId, positionTagKey, getUserLessonState } from "./lessonStatus"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("tagId", () => {
  it("tagType:tagKey 形式で結合する", () => {
    expect(tagId({ tagType: "technique", tagKey: "スタッカート" })).toBe("technique:スタッカート")
    expect(tagId({ tagType: "position", tagKey: "6" })).toBe("position:6")
  })
})

describe("positionTagKey (確定#8: 2nd以上でゲート・6以上は '6')", () => {
  it("1st ポジションはゲートなし (null)", () => {
    expect(positionTagKey("1st")).toBeNull()
    expect(positionTagKey("1")).toBeNull()
  })
  it("2nd〜5th はその数字を key にする", () => {
    expect(positionTagKey("2nd")).toBe("2")
    expect(positionTagKey("3rd")).toBe("3")
    expect(positionTagKey("4th")).toBe("4")
    expect(positionTagKey("5th")).toBe("5")
  })
  it("6以上は '6' に正規化", () => {
    expect(positionTagKey("6th")).toBe("6")
    expect(positionTagKey("7th")).toBe("6")
    expect(positionTagKey("10")).toBe("6")
    expect(positionTagKey("12th")).toBe("6")
  })
  it("数字で始まらない入力は null", () => {
    expect(positionTagKey("abc")).toBeNull()
    expect(positionTagKey("")).toBeNull()
    expect(positionTagKey("th3")).toBeNull()
  })
  it("先頭の数字だけを見る (末尾の序数語は無視)", () => {
    expect(positionTagKey("2")).toBe("2")
    expect(positionTagKey("2番")).toBe("2")
  })
})

describe("getUserLessonState: ユニオン = クリア ∪ 申告(≠REVOKED)", () => {
  it("正式クリアと自己申告を正しく分離しつつユニオンにまとめる", async () => {
    findMany.userLessonClear.mockResolvedValue([
      { tagType: "technique", tagKey: "スタッカート" },
      { tagType: "position", tagKey: "3" },
    ])
    findMany.userTagAcquisition.mockResolvedValue([
      // クリア済みと重複 → selfReported には入れない
      { tagType: "technique", tagKey: "スタッカート" },
      // 申告のみ → selfReported かつ union
      { tagType: "technique", tagKey: "トリル" },
    ])
    findMany.userLessonPlay.mockResolvedValue([
      { practiceItemId: "pi_1", playCount: 3 },
    ])

    const st = await getUserLessonState("user-1")

    expect(st.cleared).toEqual(new Set(["technique:スタッカート", "position:3"]))
    // 申告のみで未クリアの1件だけ
    expect(st.selfReported).toEqual(new Set(["technique:トリル"]))
    // ユニオン = クリア2 + 申告1(重複除く)
    expect(st.union).toEqual(
      new Set(["technique:スタッカート", "position:3", "technique:トリル"]),
    )
    expect(st.plays.get("pi_1")).toBe(3)
  })

  it("REVOKED は prisma クエリの where で除外される (state ≠ REVOKED)", async () => {
    findMany.userLessonClear.mockResolvedValue([])
    findMany.userTagAcquisition.mockResolvedValue([])
    findMany.userLessonPlay.mockResolvedValue([])

    await getUserLessonState("user-x")

    const arg = findMany.userTagAcquisition.mock.calls[0][0] as {
      where: { userId: string; state: { not: string } }
    }
    expect(arg.where.userId).toBe("user-x")
    expect(arg.where.state).toEqual({ not: "REVOKED" })
  })

  it("申告のみ(クリア無し)は全て selfReported かつ union", async () => {
    findMany.userLessonClear.mockResolvedValue([])
    findMany.userTagAcquisition.mockResolvedValue([
      { tagType: "position", tagKey: "6" },
      { tagType: "double_stop", tagKey: "3度" },
    ])
    findMany.userLessonPlay.mockResolvedValue([])

    const st = await getUserLessonState("u")
    expect(st.cleared.size).toBe(0)
    expect(st.selfReported).toEqual(new Set(["position:6", "double_stop:3度"]))
    expect(st.union).toEqual(new Set(["position:6", "double_stop:3度"]))
  })

  it("何も無いユーザは全て空集合", async () => {
    findMany.userLessonClear.mockResolvedValue([])
    findMany.userTagAcquisition.mockResolvedValue([])
    findMany.userLessonPlay.mockResolvedValue([])
    const st = await getUserLessonState("u")
    expect(st.cleared.size).toBe(0)
    expect(st.selfReported.size).toBe(0)
    expect(st.union.size).toBe(0)
    expect(st.plays.size).toBe(0)
  })
})
