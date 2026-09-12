// 課金の純粋な定数 (2026-09-12)。client からも import されるので prisma を import しない (plan.ts は再エクスポートする)。

/**
 * Apple のアプリ内課金の製品 ID (要件整理 v2.7 §5)。App Store Connect の登録と一致させる。
 * 後から変えられない。年額がレベル 1 (上位)・月額がレベル 2 (下位)。
 */
export const APPLE_PRODUCT_IDS = {
  yearly: "com.arcodaviolin.app.plus.yearly",
  monthly: "com.arcodaviolin.app.plus.monthly",
} as const
export type ApplePlanKind = keyof typeof APPLE_PRODUCT_IDS

/** 開発者アカウントの印。Apple に契約が無くても契約中として扱う (管理画面からだけ付ける) */
export const PLAN_GRANT_INTERNAL = "internal"

/** ゲストの 1 回ためし: 公式曲を 1 回だけ。基礎練は対象外 */
export const GUEST_TRIAL_GRADINGS = 1
/** ゲストの記録を残す日数。過ぎたら Cron が User ごと消す */
export const GUEST_RETENTION_DAYS = 30
