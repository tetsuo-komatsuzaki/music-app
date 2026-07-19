import { describe, it, expect, vi, beforeEach } from "vitest"

// 監査⑫ 認証欠落+IDOR 修正の回帰防止
vi.mock("@/app/_libs/requireAuth", () => ({ requireAuthAction: vi.fn() }))
vi.mock("@/app/_libs/prisma", () => ({
  prisma: { score: { findFirst: vi.fn() }, practiceItem: { findUnique: vi.fn() } },
}))
vi.mock("@/app/_libs/lessonStatus", () => ({
  getLessonInventory: vi.fn().mockResolvedValue(new Map()),
  getUserLessonState: vi.fn().mockResolvedValue({ union: new Set() }),
  tagId: (g: any) => `${g.tagType}:${g.tagKey}`,
  positionTagKey: (n: string) => (Number(n) >= 2 ? n : null),
}))
vi.mock("@/app/[userId]/lessons/_lib/content", () => ({ LESSON_BY_TAG: new Map() }))

import { getRequiredSkills } from "./getRequiredSkills"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { prisma } from "@/app/_libs/prisma"

const VALID = "cmmm46xn40000jgjytot9eobc"
const authOk = (id = "u1") => (requireAuthAction as any).mockResolvedValue({ ok: true, user: { dbUser: { id } } })

describe("getRequiredSkills", () => {
  beforeEach(() => vi.clearAllMocks())

  it("未認証は [] (DBを引かない)", async () => {
    ;(requireAuthAction as any).mockResolvedValue({ ok: false, error: "no" })
    expect(await getRequiredSkills("score", VALID)).toEqual([])
    expect(prisma.score.findFirst).not.toHaveBeenCalled()
  })

  it("不正 id は []", async () => {
    authOk()
    expect(await getRequiredSkills("score", "bad")).toEqual([])
  })

  it("他人の非公開曲は [] (IDOR防止)", async () => {
    authOk("u1")
    ;(prisma.score.findFirst as any).mockResolvedValue({
      createdById: "other", isShared: false,
      scoreTechniqueTags: [{ techniqueTag: { name: "スタッカート" } }],
      featureTags: [], positions: [],
    })
    expect(await getRequiredSkills("score", VALID)).toEqual([])
  })

  it("自分の曲はタグから技術チップを返す", async () => {
    authOk("u1")
    ;(prisma.score.findFirst as any).mockResolvedValue({
      createdById: "u1", isShared: false,
      scoreTechniqueTags: [{ techniqueTag: { name: "スタッカート" } }],
      featureTags: [], positions: [],
    })
    const r = await getRequiredSkills("score", VALID)
    expect(r.length).toBe(1)
    expect(r[0].tagType).toBe("technique")
  })
})
