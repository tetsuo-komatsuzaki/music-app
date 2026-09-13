import { describe, it, expect } from "vitest"
import { resolveBillingProvider, shouldCancelStripeOnDeletion, isStripeLiveStatus, billingNoteProvider } from "./billingProviderOf"

describe("resolveBillingProvider", () => {
  it("列の値を正とする", () => {
    expect(resolveBillingProvider({ billingProvider: "apple", stripeSubscriptionId: "sub_1" })).toBe("apple")
    expect(resolveBillingProvider({ billingProvider: "stripe" })).toBe("stripe")
  })
  it("列が空でも Stripe の加入歴があれば stripe (バックフィル前の既存契約者)", () => {
    expect(resolveBillingProvider({ billingProvider: null, stripeSubscriptionId: "sub_1", planStatus: "active" })).toBe("stripe")
    expect(resolveBillingProvider({ billingProvider: null, stripeSubscriptionId: "sub_1", planStatus: "canceled" })).toBe("stripe")
  })
  it("どちらも無ければ null", () => {
    expect(resolveBillingProvider({ billingProvider: null, stripeSubscriptionId: null })).toBeNull()
    expect(resolveBillingProvider({})).toBeNull()
  })
})

describe("shouldCancelStripeOnDeletion", () => {
  it("Stripe の加入歴があれば確認する (billingProvider が空でも・Apple に上書きされていても)", () => {
    expect(shouldCancelStripeOnDeletion({ billingProvider: null, stripeSubscriptionId: "sub_1", planStatus: "active" })).toBe(true)
    expect(shouldCancelStripeOnDeletion({ billingProvider: "stripe", stripeSubscriptionId: "sub_1", planStatus: "canceled" })).toBe(true)
    expect(shouldCancelStripeOnDeletion({ billingProvider: "apple", stripeSubscriptionId: "sub_1", planStatus: "active" })).toBe(true)
  })
  it("加入歴が無ければ確認しない", () => {
    expect(shouldCancelStripeOnDeletion({ billingProvider: null, stripeSubscriptionId: null, planStatus: "active" })).toBe(false)
    expect(shouldCancelStripeOnDeletion({ billingProvider: "apple", stripeSubscriptionId: null })).toBe(false)
  })
})

describe("isStripeLiveStatus", () => {
  it("trialing / active / past_due だけが生きている", () => {
    for (const st of ["trialing", "active", "past_due"]) expect(isStripeLiveStatus(st)).toBe(true)
    for (const st of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", null, undefined]) expect(isStripeLiveStatus(st)).toBe(false)
  })
})

describe("billingNoteProvider", () => {
  it("Apple の契約者は常に apple", () => {
    expect(billingNoteProvider({ billingProvider: "apple", planStatus: "expired" })).toBe("apple")
  })
  it("Stripe は契約が生きている人だけ stripe。解約済みの加入歴だけなら null", () => {
    expect(billingNoteProvider({ billingProvider: null, stripeSubscriptionId: "sub_1", planStatus: "active" })).toBe("stripe")
    expect(billingNoteProvider({ billingProvider: "stripe", stripeSubscriptionId: "sub_1", planStatus: "canceled" })).toBeNull()
    expect(billingNoteProvider({ billingProvider: null, stripeSubscriptionId: null })).toBeNull()
  })
})
