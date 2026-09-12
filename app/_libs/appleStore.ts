// StoreKit のブリッジ (2026-09-12 要件整理 v2.7 §5 N-2)。
//
// アプリは arcodaviolin.com をそのまま表示する殻 (remote URL 方式) なので、@capacitor/core は積まず、
// 殻が注入する window.Capacitor.nativePromise で Swift 側の "ArcodaStore" プラグインを呼ぶ
// (arcodaAuthBrowser.ts と同じ作法)。Web 版や未対応の殻では null を返し、画面側が「読み込めませんでした」を出す。
//
// 価格と期間は必ず Apple から受け取った値を表示する。1,280 のような数字はここにもコードにも書かない。
import { getCapacitor, isNativeApp } from "./isNativeApp"
import { APPLE_PRODUCT_IDS, type ApplePlanKind } from "./planConstants"

export type StoreProduct = {
  productId: string
  /** 表示用の価格。例 "¥12,800" (Apple の displayPrice) */
  displayPrice: string
  /** 導入オファー (2 週間無料) の対象か。2 回目以降は false */
  introEligible: boolean
  /** 期間: "P1Y" / "P1M" (ISO 8601 の期間) */
  period: string
  /** 価格の数値 (Apple の price)。年額の「月あたり」を出すためだけに使う */
  price?: number
  /** 通貨コード (例 "JPY") */
  currencyCode?: string
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

function call<T>(method: string, options?: unknown): Promise<T> | null {
  const cap = getCapacitor()
  if (!cap || !isNativeApp()) return null
  if (typeof cap.isPluginAvailable === "function" && !cap.isPluginAvailable("ArcodaStore")) return null
  if (typeof cap.nativePromise !== "function") return null
  return cap.nativePromise("ArcodaStore", method, options ?? {}) as Promise<T>
}

/** 殻に StoreKit プラグインがあるか。無ければ画面は「読み込めませんでした」を出す */
export function isStoreAvailable(): boolean {
  const cap = getCapacitor()
  if (!cap || !isNativeApp()) return false
  return typeof cap.isPluginAvailable !== "function" || cap.isPluginAvailable("ArcodaStore")
}

/** 2 商品の価格・期間・導入オファーの対象かを Apple から取る。取れなければ null */
export async function fetchProducts(): Promise<Record<ApplePlanKind, StoreProduct> | null> {
  const p = call<{ products: StoreProduct[] }>("getProducts", { productIds: Object.values(APPLE_PRODUCT_IDS) })
  if (!p) return null
  try {
    const r = await p
    const byId = new Map(r.products.map((x) => [x.productId, x]))
    const yearly = byId.get(APPLE_PRODUCT_IDS.yearly)
    const monthly = byId.get(APPLE_PRODUCT_IDS.monthly)
    if (!yearly || !monthly) return null
    return { yearly, monthly }
  } catch {
    return null
  }
}

/** 購入シートを出す。appAccountToken は supabaseUserId (UUID) をそのまま渡す */
export async function purchase(kind: ApplePlanKind, appAccountToken: string): Promise<PurchaseResult> {
  const p = call<PurchaseResult>("purchase", { productId: APPLE_PRODUCT_IDS[kind], appAccountToken })
  if (!p) return { status: "error", message: "この端末では購入できません" }
  try {
    return await p
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "購入に失敗しました" }
  }
}

/** 購入を復元: この Apple アカウントの現在の権利を取り直す */
export async function restorePurchases(): Promise<RestoreResult> {
  const p = call<RestoreResult>("restore")
  if (!p) return { status: "error", message: "この端末では復元できません" }
  try {
    return await p
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "復元に失敗しました" }
  }
}

/** Apple の管理シート (変更・解約) をアプリ内に出す。出せなければ false */
export async function showManageSubscriptions(): Promise<boolean> {
  const p = call<void>("manageSubscriptions")
  if (!p) return false
  try {
    await p
    return true
  } catch {
    return false
  }
}
