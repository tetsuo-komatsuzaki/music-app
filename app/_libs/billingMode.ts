// 課金の経路スイッチ (2026-09-12 要件整理 v2.7)。
//
// "apple"  = iOS のアプリ内課金だけで売る (確定した設計)。Stripe は眠らせる (コードは残し導線だけ止める)。
// "stripe" = 従来 (Web の Stripe Checkout)。ローンチ前の本番はこちらのままにして、既存の利用者に影響を出さない。
//
// 値は NEXT_PUBLIC_BILLING_MODE。未設定は "stripe"。切り替えは Vercel の環境変数だけで行い、コードの再デプロイを要らなくする。
import { isNativeApp } from "./isNativeApp"

export type BillingMode = "apple" | "stripe"

export function billingMode(): BillingMode {
  return process.env.NEXT_PUBLIC_BILLING_MODE === "apple" ? "apple" : "stripe"
}

export function isAppleBilling(): boolean {
  return billingMode() === "apple"
}

/**
 * App Store の製品ページ URL。Web (ブラウザ) の登録導線をここへ差し替える。
 * 未設定の間は Web の登録画面を従来どおり出す (アプリ公開前に Web の入口を塞がないため)。
 */
export function appStoreUrl(): string | null {
  const v = process.env.NEXT_PUBLIC_APP_STORE_URL
  return v && v.startsWith("https://") ? v : null
}

/** 導線の可否は isNativeApp.ts の canShowBillingEntryPoint が持つ (循環 import を避けるため、ここでは再エクスポートだけ) */
export { canShowBillingEntryPoint } from "./isNativeApp"

/** iOS のアプリ内で、Apple の課金の流れ (アルコプラスをはじめる) を出せるか */
export function isAppleFlowHere(): boolean {
  return isAppleBilling() && isNativeApp()
}
