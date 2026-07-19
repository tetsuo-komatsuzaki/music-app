import { describe, it, expect, vi, beforeEach } from "vitest"

// materialGroup.ts は "./prisma" 経由で実 PrismaClient を読み込むためモック必須。
// vi.mock は巻き上げられるので vi.hoisted で prismaMock を先行生成する。
const prismaMock = vi.hoisted(() => ({
  score: { findUnique: vi.fn(), update: vi.fn() },
  practiceItem: { findUnique: vi.fn(), update: vi.fn() },
  materialGroup: { create: vi.fn() },
}))
vi.mock("./prisma", () => ({ prisma: prismaMock }))

import {
  MATERIAL_KIND_BY_CATEGORY,
  ensurePracticeItemGroup,
  ensureScoreGroup,
} from "./materialGroup"
import { PRACTICE_CATEGORIES } from "./practiceConstants"

beforeEach(() => {
  vi.clearAllMocks()
})

// INTENDED: 教材=グループ⊃変種。カテゴリ→MaterialKind は total、1教材=1グループで orphan 防止。

describe("MATERIAL_KIND_BY_CATEGORY", () => {
  it("各カテゴリの kind は key の UPPER_SNAKE 形", () => {
    for (const [cat, kind] of Object.entries(MATERIAL_KIND_BY_CATEGORY)) {
      expect(kind).toBe(cat.toUpperCase())
    }
  })

  it("全 PracticeCategory (基礎練6 + etude) を被覆する", () => {
    for (const c of PRACTICE_CATEGORIES) {
      expect(MATERIAL_KIND_BY_CATEGORY[c]).toBeTruthy()
    }
  })

  it("曲(score) と lesson は含まない（SONG は別経路 / lesson は変種なし）", () => {
    expect(MATERIAL_KIND_BY_CATEGORY["score"]).toBeUndefined()
    expect(MATERIAL_KIND_BY_CATEGORY["lesson"]).toBeUndefined()
  })

  it("キー集合は PracticeCategory と過不足なく一致する", () => {
    expect(Object.keys(MATERIAL_KIND_BY_CATEGORY).sort()).toEqual(
      [...PRACTICE_CATEGORIES].sort()
    )
  })
})

describe("ensurePracticeItemGroup", () => {
  it("マップ外カテゴリ(lesson)は kind 無し → null を返しグループを作らない", async () => {
    prismaMock.practiceItem.findUnique.mockResolvedValue({
      id: "i1",
      groupId: null,
      category: "lesson",
      title: "導入",
      composer: null,
      coverImagePath: null,
    })
    const r = await ensurePracticeItemGroup("i1")
    expect(r).toBeNull()
    expect(prismaMock.materialGroup.create).not.toHaveBeenCalled()
    expect(prismaMock.practiceItem.update).not.toHaveBeenCalled()
  })

  it("既に groupId があれば据え置き（再作成しない）", async () => {
    prismaMock.practiceItem.findUnique.mockResolvedValue({
      id: "i2",
      groupId: "g-existing",
      category: "scale",
      title: "音階",
      composer: null,
      coverImagePath: null,
    })
    const r = await ensurePracticeItemGroup("i2")
    expect(r).toBe("g-existing")
    expect(prismaMock.materialGroup.create).not.toHaveBeenCalled()
  })

  it("存在しない教材は null", async () => {
    prismaMock.practiceItem.findUnique.mockResolvedValue(null)
    expect(await ensurePracticeItemGroup("nope")).toBeNull()
    expect(prismaMock.materialGroup.create).not.toHaveBeenCalled()
  })

  it("マップ内カテゴリは正しい kind でグループを作成し紐付ける", async () => {
    prismaMock.practiceItem.findUnique.mockResolvedValue({
      id: "i3",
      groupId: null,
      category: "double_stop",
      title: "重音練習",
      composer: "Ševčík",
      coverImagePath: "cover/x.png",
    })
    prismaMock.materialGroup.create.mockResolvedValue({ id: "g-new" })
    const r = await ensurePracticeItemGroup("i3")
    expect(r).toBe("g-new")
    expect(prismaMock.materialGroup.create).toHaveBeenCalledTimes(1)
    const arg = prismaMock.materialGroup.create.mock.calls[0][0]
    expect(arg.data.kind).toBe("DOUBLE_STOP")
    expect(arg.data.category).toBe("double_stop")
    expect(prismaMock.practiceItem.update).toHaveBeenCalledWith({
      where: { id: "i3" },
      data: { groupId: "g-new" },
    })
  })
})

describe("ensureScoreGroup", () => {
  it("存在しない曲は null", async () => {
    prismaMock.score.findUnique.mockResolvedValue(null)
    expect(await ensureScoreGroup("nope")).toBeNull()
    expect(prismaMock.materialGroup.create).not.toHaveBeenCalled()
  })

  it("既に groupId があれば据え置き", async () => {
    prismaMock.score.findUnique.mockResolvedValue({
      id: "s1",
      groupId: "g-song",
      title: "きらきら星",
      composer: null,
      genre: "warabe",
      coverImagePath: null,
    })
    expect(await ensureScoreGroup("s1")).toBe("g-song")
    expect(prismaMock.materialGroup.create).not.toHaveBeenCalled()
  })

  it("未紐付けの曲は SONG グループを作り紐付ける", async () => {
    prismaMock.score.findUnique.mockResolvedValue({
      id: "s2",
      groupId: null,
      title: "メヌエット",
      composer: "Bach",
      genre: "classic",
      coverImagePath: null,
    })
    prismaMock.materialGroup.create.mockResolvedValue({ id: "g-song2" })
    const r = await ensureScoreGroup("s2")
    expect(r).toBe("g-song2")
    const arg = prismaMock.materialGroup.create.mock.calls[0][0]
    expect(arg.data.kind).toBe("SONG")
    expect(arg.data.category).toBe("score")
    expect(arg.data.genre).toBe("classic")
    expect(prismaMock.score.update).toHaveBeenCalledWith({
      where: { id: "s2" },
      data: { groupId: "g-song2" },
    })
  })
})
