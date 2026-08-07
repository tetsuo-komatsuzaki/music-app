// Stripe → User 写像のユニットテスト (課金 Phase 2, 2026-08-07)
import { describe, expect, it } from "vitest"
import { isTrialEligible, subscriptionToUserFields } from "./stripe"

describe("subscriptionToUserFields", () => {
  const base = { id: "sub_123", status: "active", current_period_end: 1_790_000_000 }

  it.each(["trialing", "active", "past_due"])("status=%s は plan=plus", (status) => {
    expect(subscriptionToUserFields({ ...base, status }).plan).toBe("plus")
  })

  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"])(
    "status=%s は plan=null (無料に落とす)",
    (status) => {
      expect(subscriptionToUserFields({ ...base, status }).plan).toBeNull()
    },
  )

  it("planStatus と subscriptionId をそのまま写す", () => {
    const f = subscriptionToUserFields(base)
    expect(f.planStatus).toBe("active")
    expect(f.stripeSubscriptionId).toBe("sub_123")
  })

  it("current_period_end (秒) を Date に変換する", () => {
    expect(subscriptionToUserFields(base).planCurrentPeriodEnd).toEqual(new Date(1_790_000_000 * 1000))
  })

  it("新 API (Basil): current_period_end が items 側にあっても読める", () => {
    const f = subscriptionToUserFields({
      id: "sub_x", status: "active",
      items: { data: [{ current_period_end: 1_790_000_000 }] },
    })
    expect(f.planCurrentPeriodEnd).toEqual(new Date(1_790_000_000 * 1000))
  })

  it("period end が無ければ null", () => {
    expect(subscriptionToUserFields({ id: "s", status: "canceled" }).planCurrentPeriodEnd).toBeNull()
  })
})

describe("isTrialEligible", () => {
  it("一度もサブスクを持っていなければトライアル可", () => {
    expect(isTrialEligible({ stripeSubscriptionId: null })).toBe(true)
  })
  it("過去にサブスクがあれば不可 (解約→再加入で2回目のトライアルを与えない)", () => {
    expect(isTrialEligible({ stripeSubscriptionId: "sub_old" })).toBe(false)
  })
})
