// Apple の取引 → planStatus の写し (2026-09-13 検証ループ)。純関数だけを検査する。
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/app/_libs/prisma", () => ({ prisma: {} }))

import { derivePlanStatus, isKnownProduct, type AppleTransaction, type AppleRenewalInfo } from "./appleServer"
import { APPLE_PRODUCT_IDS } from "@/app/_libs/planConstants"

const NOW = Date.UTC(2026, 8, 13, 0, 0, 0)
const DAY = 86400000
function tx(over: Partial<AppleTransaction> = {}): AppleTransaction {
  return {
    originalTransactionId: "otx-1",
    transactionId: "tx-1",
    productId: APPLE_PRODUCT_IDS.yearly,
    bundleId: "com.arcodaviolin.app",
    environment: "Sandbox",
    purchaseDate: NOW - DAY,
    expiresDate: NOW + 13 * DAY,
    ...over,
  }
}
function renewal(over: Partial<AppleRenewalInfo> = {}): AppleRenewalInfo {
  return { originalTransactionId: "otx-1", autoRenewStatus: 1, environment: "Sandbox", ...over }
}

describe("derivePlanStatus (要件整理 v2.7 §2 の通知表)", () => {
  it("SUBSCRIBED 無料期間つき (offerType 1) は trialing", () => {
    expect(derivePlanStatus(tx({ offerType: 1 }), renewal(), NOW)).toBe("trialing")
  })
  it("請求ありの購入・DID_RENEW は active", () => {
    expect(derivePlanStatus(tx(), renewal(), NOW)).toBe("active")
    expect(derivePlanStatus(tx({ expiresDate: NOW + 365 * DAY }), null, NOW)).toBe("active")
  })
  it("DID_FAIL_TO_RENEW (請求リトライ中) は猶予なしで expired (§8-9)", () => {
    expect(derivePlanStatus(tx(), renewal({ isInBillingRetryPeriod: true }), NOW)).toBe("expired")
  })
  it("リトライが通って DID_RENEW が来れば active に戻る", () => {
    expect(derivePlanStatus(tx({ expiresDate: NOW + 30 * DAY }), renewal({ isInBillingRetryPeriod: false }), NOW)).toBe("active")
  })
  it("EXPIRED (expiresDate が過去) は expired", () => {
    expect(derivePlanStatus(tx({ expiresDate: NOW - 1 }), renewal(), NOW)).toBe("expired")
  })
  it("expiresDate ちょうど今は expired (<=)", () => {
    expect(derivePlanStatus(tx({ expiresDate: NOW }), renewal(), NOW)).toBe("expired")
  })
  it("REFUND / REVOKE (revocationDate) は期限内でも expired", () => {
    expect(derivePlanStatus(tx({ revocationDate: NOW - 1000 }), renewal(), NOW)).toBe("expired")
  })
  it("自動更新オフ (DID_CHANGE_RENEWAL_STATUS) は状態を変えない: 期限内なら active のまま", () => {
    expect(derivePlanStatus(tx(), renewal({ autoRenewStatus: 0 }), NOW)).toBe("active")
  })
  it("無料期間中に自動更新オフでも trialing のまま", () => {
    expect(derivePlanStatus(tx({ offerType: 1 }), renewal({ autoRenewStatus: 0 }), NOW)).toBe("trialing")
  })
  it("無料期間 (offerType 1) でも期限が過ぎていれば expired", () => {
    expect(derivePlanStatus(tx({ offerType: 1, expiresDate: NOW - DAY }), renewal(), NOW)).toBe("expired")
  })
})

describe("isKnownProduct (製品 ID の定数化 §5)", () => {
  it("年額と月額だけを知っている", () => {
    expect(isKnownProduct("com.arcodaviolin.app.plus.yearly")).toBe(true)
    expect(isKnownProduct("com.arcodaviolin.app.plus.monthly")).toBe(true)
    expect(isKnownProduct("com.arcodaviolin.app.plus.weekly")).toBe(false)
    expect(isKnownProduct("")).toBe(false)
  })
})
