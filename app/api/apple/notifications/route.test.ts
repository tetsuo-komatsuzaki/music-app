// 通知の受け口の単体 (2026-09-13 検証ループ CR-1-09): 署名検証を差し替えて、冪等・data 無し・持ち主なしの経路を通す
import { beforeEach, describe, expect, it, vi } from "vitest"

const { verify, apply, db } = vi.hoisted(() => ({
  verify: vi.fn(),
  apply: vi.fn(),
  db: { appleNotification: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() } },
}))
vi.mock("server-only", () => ({}))
vi.mock("@/app/_libs/prisma", () => ({ prisma: db }))
vi.mock("@/app/_libs/apple/appleServer", () => ({ verifyAppleJws: (...a: unknown[]) => verify(...a), applyTransaction: (...a: unknown[]) => apply(...a) }))

import { POST } from "./route"

const req = (body: unknown) => new Request("http://x/api/apple/notifications", { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) })
const payload = { notificationType: "SUBSCRIBED", subtype: "INITIAL_BUY", notificationUUID: "u-1", data: { bundleId: "com.arcodaviolin.app", environment: "Sandbox", signedTransactionInfo: "tx.jws", signedRenewalInfo: "rn.jws" } }
const tx = { originalTransactionId: "otx", transactionId: "t", productId: "com.arcodaviolin.app.plus.yearly", bundleId: "com.arcodaviolin.app", environment: "Sandbox", purchaseDate: 1, expiresDate: 2, appAccountToken: "uuid-1" }

beforeEach(() => {
  verify.mockReset(); apply.mockReset()
  db.appleNotification.findUnique.mockReset(); db.appleNotification.upsert.mockReset(); db.appleNotification.update.mockReset()
  db.appleNotification.findUnique.mockResolvedValue(null)
  db.appleNotification.upsert.mockResolvedValue({})
  db.appleNotification.update.mockResolvedValue({})
})

describe("POST /api/apple/notifications", () => {
  it("同じ notificationUUID の 2 回目は duplicate で User を書かない (REQ-021)", async () => {
    verify.mockResolvedValueOnce(payload)
    db.appleNotification.findUnique.mockResolvedValueOnce({ processedAt: new Date() })
    const r = await POST(req({ signedPayload: "p.jws" }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, duplicate: true })
    expect(apply).not.toHaveBeenCalled()
    expect(db.appleNotification.upsert).not.toHaveBeenCalled()
  })
  it("持ち主が見つからなくても Apple には 200 を返し、行は processedAt つきで残る (REQ-028)", async () => {
    verify.mockResolvedValueOnce(payload).mockResolvedValueOnce(tx).mockResolvedValueOnce({ originalTransactionId: "otx", autoRenewStatus: 1, environment: "Sandbox" })
    apply.mockResolvedValueOnce({ ok: false, reason: "no_user" })
    const r = await POST(req({ signedPayload: "p.jws" }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, applied: false, reason: "no_user" })
    expect(db.appleNotification.upsert).toHaveBeenCalledTimes(1)
    const upsert = db.appleNotification.upsert.mock.calls[0][0] as { create: { signedPayload: string; appAccountToken: string } }
    expect(upsert.create.signedPayload).toBe("p.jws")
    expect(upsert.create.appAccountToken).toBe("uuid-1")
    expect(db.appleNotification.update).toHaveBeenCalledTimes(1)
  })
  it("適用できたら applied:true", async () => {
    verify.mockResolvedValueOnce(payload).mockResolvedValueOnce(tx).mockResolvedValueOnce({ originalTransactionId: "otx", autoRenewStatus: 1, environment: "Sandbox" })
    apply.mockResolvedValueOnce({ ok: true, userId: "db-1", status: "trialing" })
    const r = await POST(req({ signedPayload: "p.jws" }))
    expect(await r.json()).toEqual({ ok: true, applied: true })
  })
  it("data が無い (App Store Connect の TEST 通知) は 400 no transaction・行は残る", async () => {
    verify.mockResolvedValueOnce({ notificationType: "TEST", notificationUUID: "u-test" })
    const r = await POST(req({ signedPayload: "p.jws" }))
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({ error: "no transaction" })
    expect(db.appleNotification.upsert).toHaveBeenCalledTimes(1)
    expect(apply).not.toHaveBeenCalled()
  })
  it("外側は通るが中の取引の署名が壊れている → 400 でエラーを行に残す", async () => {
    verify.mockResolvedValueOnce(payload).mockRejectedValueOnce(new Error("証明書チェーンの検証に失敗しました (0)"))
    const r = await POST(req({ signedPayload: "p.jws" }))
    expect(r.status).toBe(400)
    const upsert = db.appleNotification.upsert.mock.calls[0][0] as { create: { error: string | null } }
    expect(upsert.create.error).toMatch(/証明書/)
  })
  it("署名が通らない → 400 で保存しない (REQ-022)", async () => {
    verify.mockRejectedValueOnce(new Error("x5c がありません"))
    const r = await POST(req({ signedPayload: "bad" }))
    expect(r.status).toBe(400)
    expect(db.appleNotification.upsert).not.toHaveBeenCalled()
  })
  it("壊れた JSON・signedPayload 無しは 400", async () => {
    expect((await POST(req("{bad"))).status).toBe(400)
    expect((await POST(req({}))).status).toBe(400)
  })
})
