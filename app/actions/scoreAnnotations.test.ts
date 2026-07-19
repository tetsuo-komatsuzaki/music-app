import { describe, it, expect, vi, beforeEach } from "vitest"

// 監査バッチB⑧ (P2002リトライ) + 認証/対象検証の回帰防止
vi.mock("@/app/_libs/requireAuth", () => ({ requireAuthAction: vi.fn() }))
vi.mock("@/app/_libs/prisma", () => ({
  prisma: {
    scoreAnnotation: { findFirst: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  },
}))

import { getScoreAnnotation, saveScoreAnnotation } from "./scoreAnnotations"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { prisma } from "@/app/_libs/prisma"

const VALID = "cmmm46xn40000jgjytot9eobc"
const authOk = (id = "u1") => (requireAuthAction as any).mockResolvedValue({ ok: true, user: { dbUser: { id } } })

describe("getScoreAnnotation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("未認証は error", async () => {
    ;(requireAuthAction as any).mockResolvedValue({ ok: false, error: "no" })
    const r = await getScoreAnnotation({ scoreId: VALID })
    expect(r.ok).toBe(false)
  })

  it("対象idが無効なら error", async () => {
    authOk()
    const r = await getScoreAnnotation({ scoreId: "bad" })
    expect(r.ok).toBe(false)
    expect(prisma.scoreAnnotation.findFirst).not.toHaveBeenCalled()
  })

  it("レコード無しは空データ", async () => {
    authOk()
    ;(prisma.scoreAnnotation.findFirst as any).mockResolvedValue(null)
    const r = await getScoreAnnotation({ scoreId: VALID })
    expect(r).toEqual({ ok: true, data: {} })
  })

  it("保存済みデータを返す", async () => {
    authOk()
    const data = { highlight: [{ fromNote: 1, toNote: 3 }] }
    ;(prisma.scoreAnnotation.findFirst as any).mockResolvedValue({ data })
    const r = await getScoreAnnotation({ scoreId: VALID })
    expect(r).toEqual({ ok: true, data })
  })
})

describe("saveScoreAnnotation", () => {
  beforeEach(() => vi.clearAllMocks())

  it("未認証は error", async () => {
    ;(requireAuthAction as any).mockResolvedValue({ ok: false, error: "no" })
    const r = await saveScoreAnnotation({ scoreId: VALID, data: {} })
    expect(r.ok).toBe(false)
  })

  it("通常は upsert される", async () => {
    authOk()
    ;(prisma.scoreAnnotation.upsert as any).mockResolvedValue({})
    const r = await saveScoreAnnotation({ scoreId: VALID, data: { warnings: [] } })
    expect(r.ok).toBe(true)
    expect(prisma.scoreAnnotation.upsert).toHaveBeenCalledOnce()
    expect(prisma.scoreAnnotation.updateMany).not.toHaveBeenCalled()
  })

  it("P2002競合は updateMany で再試行 (⑧)", async () => {
    authOk()
    ;(prisma.scoreAnnotation.upsert as any).mockRejectedValue({ code: "P2002" })
    ;(prisma.scoreAnnotation.updateMany as any).mockResolvedValue({ count: 1 })
    const r = await saveScoreAnnotation({ scoreId: VALID, data: { warnings: [] } })
    expect(r.ok).toBe(true)
    expect(prisma.scoreAnnotation.updateMany).toHaveBeenCalledOnce()
  })

  it("P2002以外のエラーは投げる", async () => {
    authOk()
    ;(prisma.scoreAnnotation.upsert as any).mockRejectedValue({ code: "P2003" })
    await expect(saveScoreAnnotation({ scoreId: VALID, data: {} })).rejects.toBeTruthy()
  })
})
