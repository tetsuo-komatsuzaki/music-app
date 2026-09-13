// 購入証明の受け口の単体 (2026-09-13 検証ループ CR-1-09): appAccountToken 不一致 403・未認証 401・衝突 409
import { beforeEach, describe, expect, it, vi } from "vitest"

const { verify, apply, state } = vi.hoisted(() => ({ verify: vi.fn(), apply: vi.fn(), state: { user: { id: "uuid-me" } as { id: string } | null } }))
vi.mock("server-only", () => ({}))
vi.mock("@/app/_libs/supabaseServer", () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }) }))
vi.mock("@/app/_libs/apple/appleServer", () => ({ verifyAppleJws: (...a: unknown[]) => verify(...a), applyTransaction: (...a: unknown[]) => apply(...a), isKnownProduct: () => true }))

import { POST } from "./route"

const req = (body: unknown) => new Request("http://x/api/apple/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
const tx = (token?: string) => ({ originalTransactionId: "otx", transactionId: "t", productId: "com.arcodaviolin.app.plus.yearly", bundleId: "com.arcodaviolin.app", environment: "Sandbox", purchaseDate: 1, expiresDate: 2, appAccountToken: token })

beforeEach(() => { verify.mockReset(); apply.mockReset(); state.user = { id: "uuid-me" } })

describe("POST /api/apple/verify", () => {
  it("未認証は 401", async () => {
    state.user = null
    expect((await POST(req({ jws: "x" }))).status).toBe(401)
  })
  it("jws 無しは 400", async () => {
    expect((await POST(req({}))).status).toBe(400)
  })
  it("appAccountToken が本人と違う (他人の証明) は 403 で反映しない (REQ-024)", async () => {
    verify.mockResolvedValueOnce(tx("uuid-other"))
    const r = await POST(req({ jws: "x" }))
    expect(r.status).toBe(403)
    expect(apply).not.toHaveBeenCalled()
  })
  it("本人の token なら反映して 200", async () => {
    verify.mockResolvedValueOnce(tx("uuid-me"))
    apply.mockResolvedValueOnce({ ok: true, userId: "db", status: "trialing" })
    const r = await POST(req({ jws: "x" }))
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, status: "trialing" })
    expect(apply.mock.calls[0][2]).toEqual({ forUserId: "uuid-me" })
  })
  it("token 無しの証明は本人に結ぶ", async () => {
    verify.mockResolvedValueOnce(tx(undefined))
    apply.mockResolvedValueOnce({ ok: true, userId: "db", status: "active" })
    expect((await POST(req({ jws: "x" }))).status).toBe(200)
  })
  it("別のアカウントに結び済みの契約は 409 conflict (REQ-025/082)", async () => {
    verify.mockResolvedValueOnce(tx("uuid-me"))
    apply.mockResolvedValueOnce({ ok: false, reason: "conflict" })
    const r = await POST(req({ jws: "x" }))
    expect(r.status).toBe(409)
    expect(await r.json()).toEqual({ error: "conflict" })
  })
  it("署名が通らない証明は 400", async () => {
    verify.mockRejectedValueOnce(new Error("x5c がありません"))
    expect((await POST(req({ jws: "x" }))).status).toBe(400)
  })
})
