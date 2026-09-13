// 開発者アカウント planGrant=internal と Apple の planStatus (2026-09-13 検証ループ・要件整理 v2.7 §2, §8-5)
import { describe, expect, it } from "vitest"
import { resolveEffectivePlan, TRIAL_PERIOD_DAYS } from "./plan"
import { PLAN_GRANT_INTERNAL, GUEST_TRIAL_GRADINGS, GUEST_RETENTION_DAYS, APPLE_PRODUCT_IDS } from "./planConstants"

const now = new Date("2026-09-13T00:00:00Z")
const base = { plan: null as string | null, planStatus: null as string | null, createdAt: new Date("2026-08-01T00:00:00Z"), now, restrictionStart: null }

describe("resolveEffectivePlan と planGrant", () => {
  it("planGrant=internal は契約が無くても plus", () => {
    expect(resolveEffectivePlan({ ...base, planGrant: PLAN_GRANT_INTERNAL })).toBe("plus")
    expect(resolveEffectivePlan({ ...base, plan: "free", planStatus: "expired", planGrant: PLAN_GRANT_INTERNAL })).toBe("plus")
  })
  it("planGrant が別の値や null なら効かない", () => {
    expect(resolveEffectivePlan({ ...base, planGrant: "vip" })).toBe("free")
    expect(resolveEffectivePlan({ ...base, planGrant: null })).toBe("free")
    expect(resolveEffectivePlan({ ...base, planGrant: "INTERNAL" })).toBe("free")
  })
  it("Apple の通知で書く plus/trialing は trial、plus/active は plus、free/expired は free", () => {
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: "trialing" })).toBe("trial")
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: "active" })).toBe("plus")
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: "expired" })).toBe("free")
    expect(resolveEffectivePlan({ ...base, plan: "free", planStatus: "expired" })).toBe("free")
  })
  it("想定外の planStatus は free (落ちない)", () => {
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: "paused" })).toBe("free")
  })
})

describe("定数 (要件整理 v2.7 §5, §4)", () => {
  it("製品 ID とバンドル", () => {
    expect(APPLE_PRODUCT_IDS.yearly).toBe("com.arcodaviolin.app.plus.yearly")
    expect(APPLE_PRODUCT_IDS.monthly).toBe("com.arcodaviolin.app.plus.monthly")
  })
  it("1 回ためし・30 日・Stripe の無料期間 14 日", () => {
    expect(GUEST_TRIAL_GRADINGS).toBe(1)
    expect(GUEST_RETENTION_DAYS).toBe(30)
    expect(TRIAL_PERIOD_DAYS).toBe(14)
  })
})
