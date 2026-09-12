// ArcodaStore — StoreKit 2 のブリッジの型 (2026-09-12 要件整理 v2.7 §5 N-2)。
// Web 側は @capacitor/core を積まないので、この型は殻の開発者向けの契約書。呼び出しは window.Capacitor.nativePromise("ArcodaStore", ...)。
// 実装は app/_libs/appleStore.ts (Web) と ios/Sources/ArcodaStorePlugin/ArcodaStorePlugin.swift (Swift)。

export interface StoreProduct {
  productId: string
  /** Apple の displayPrice (例 "¥12,800") */
  displayPrice: string
  /** 導入オファー (2 週間無料) の対象か (Product.SubscriptionInfo.isEligibleForIntroOffer) */
  introEligible: boolean
  /** ISO 8601 の期間 ("P1Y" / "P1M") */
  period: string
  /** 価格の数値 (Product.price) と通貨コード。年額の「月あたり」表示に使う */
  price: number
  currencyCode: string
}

export type PurchaseResult =
  | { status: "ok"; jws: string; productId: string; originalTransactionId?: string }
  | { status: "cancel" }
  | { status: "pending" }
  | { status: "error"; message: string }

export type RestoreResult =
  | { status: "ok"; transactions: Array<{ jws: string; productId: string }> }
  | { status: "none" }
  | { status: "error"; message: string }

export interface ArcodaStorePlugin {
  getProducts(options: { productIds: string[] }): Promise<{ products: StoreProduct[] }>
  /** appAccountToken は supabaseUserId (UUID)。Apple の通知にそのまま入って返る */
  purchase(options: { productId: string; appAccountToken: string }): Promise<PurchaseResult>
  restore(): Promise<RestoreResult>
  manageSubscriptions(): Promise<void>
  /** identifierForVendor。「1 回ためし」を数えるためだけに使う */
  deviceKey(): Promise<{ key: string }>
}
