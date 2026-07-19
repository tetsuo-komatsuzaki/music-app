import { describe, it, expect, vi, beforeEach } from "vitest"

// 監査バッチA① IDOR/認証 修正の回帰防止
vi.mock("@/app/_libs/requireAuth", () => ({ requireAuthAction: vi.fn() }))
vi.mock("@/app/_libs/prisma", () => ({
  prisma: { score: { findFirst: vi.fn() }, practiceItem: { findUnique: vi.fn() } },
}))
vi.mock("@/app/_libs/storageAdmin", () => ({
  storageAdmin: { storage: { from: () => ({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://x" } }) }) } },
}))
vi.mock("@/app/_libs/encodeSignedUrl", () => ({ encodeSignedUrl: (u: string | undefined) => u ?? null }))

import { getScorePreview, getPracticeItemPreview } from "./getScorePreview"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { prisma } from "@/app/_libs/prisma"

const VALID = "cmmm46xn40000jgjytot9eobc"
const authOk = (id = "u1") => (requireAuthAction as any).mockResolvedValue({ ok: true, user: { dbUser: { id } } })
const notPending = { generatedXmlPath: null, analysisStatus: "pending", buildStatus: "pending" }

describe("getScorePreview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("未認証は null (DBを引かない)", async () => {
    ;(requireAuthAction as any).mockResolvedValue({ ok: false, error: "no" })
    expect(await getScorePreview(VALID)).toBeNull()
    expect(prisma.score.findFirst).not.toHaveBeenCalled()
  })

  it("不正な id は null", async () => {
    authOk()
    expect(await getScorePreview("not-a-cuid")).toBeNull()
    expect(prisma.score.findFirst).not.toHaveBeenCalled()
  })

  it("他人の非公開曲は null (IDOR防止)", async () => {
    authOk("u1")
    ;(prisma.score.findFirst as any).mockResolvedValue({ id: VALID, createdById: "other", isShared: false, ...notPending })
    expect(await getScorePreview(VALID)).toBeNull()
  })

  it("共有曲は取得可", async () => {
    authOk("u1")
    ;(prisma.score.findFirst as any).mockResolvedValue({ id: VALID, createdById: "other", isShared: true, ...notPending })
    expect(await getScorePreview(VALID)).not.toBeNull()
  })

  it("自分の曲は取得可", async () => {
    authOk("u1")
    ;(prisma.score.findFirst as any).mockResolvedValue({ id: VALID, createdById: "u1", isShared: false, ...notPending })
    expect(await getScorePreview(VALID)).not.toBeNull()
  })
})

describe("getPracticeItemPreview", () => {
  beforeEach(() => vi.clearAllMocks())

  it("未認証は null", async () => {
    ;(requireAuthAction as any).mockResolvedValue({ ok: false, error: "no" })
    expect(await getPracticeItemPreview(VALID)).toBeNull()
    expect(prisma.practiceItem.findUnique).not.toHaveBeenCalled()
  })

  it("認証済みなら共有カリキュラムとして取得可", async () => {
    authOk()
    ;(prisma.practiceItem.findUnique as any).mockResolvedValue({ id: VALID, analysisPath: null, ...notPending })
    expect(await getPracticeItemPreview(VALID)).not.toBeNull()
  })
})
