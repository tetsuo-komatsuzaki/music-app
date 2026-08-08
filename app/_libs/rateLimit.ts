// レート制限 (2026-08-08 システム部監査 P0-2: コスト暴走/濫用の安全弁)。
//
// 目的: 録音→Cloud Run 解析(1回≈変動費)やメッセージ連投の「スクリプト的な濫用」を止める。
// 方針: 外部サービス(Upstash等)を足さず、既存の DB タイムスタンプで判定する。
//   - 実利用(数分に1回録音)は絶対に触らない緩い閾値
//   - スクリプト濫用(毎秒/大量)だけを弾く
// 週7回の採点上限(plan.ts)とは別レイヤー: あちらは課金の壁、こちらは瞬間的な濫用の壁。

export type RateLimitConfig = {
  windowMs: number // 集計窓 (この期間の件数を数える)
  max: number      // 窓内の最大件数
  minGapMs: number // 直近1件からの最小間隔 (バースト抑止)
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "too_fast" | "too_many"; retryAfterSec: number }

/**
 * 直近のイベント時刻(ms, 新しい順でも古い順でも可)から、今リクエストを許可してよいか判定。
 * 純関数(テスト対象): DB/時刻に依存しない。
 */
export function evaluateRateLimit(
  timestampsMs: number[],
  nowMs: number,
  cfg: RateLimitConfig,
): RateLimitResult {
  // 直近イベントとの間隔 (バースト抑止)
  let latest = -Infinity
  let inWindow = 0
  const windowStart = nowMs - cfg.windowMs
  for (const t of timestampsMs) {
    if (t > latest) latest = t
    if (t >= windowStart) inWindow += 1
  }
  if (latest !== -Infinity && nowMs - latest < cfg.minGapMs) {
    return { ok: false, reason: "too_fast", retryAfterSec: Math.ceil((cfg.minGapMs - (nowMs - latest)) / 1000) }
  }
  if (inWindow >= cfg.max) {
    // 窓から最古の1件が抜けるまでの待ち時間 (概算: 窓長)
    return { ok: false, reason: "too_many", retryAfterSec: Math.ceil(cfg.windowMs / 1000) }
  }
  return { ok: true }
}

// --- プリセット閾値 ---
// 録音(解析トリガ): 実利用は数分に1回。8秒間隔 + 1時間60回 で scripted 濫用のみ弾く。
export const RECORDING_LIMIT: RateLimitConfig = { windowMs: 60 * 60 * 1000, max: 60, minGapMs: 8 * 1000 }
// メッセージ: 会話の連投は許しつつ、1分30通で spam を止める。
export const MESSAGE_LIMIT: RateLimitConfig = { windowMs: 60 * 1000, max: 30, minGapMs: 500 }

/** ユーザー向けの日本語メッセージ (UIにそのまま出せる) */
export function rateLimitMessage(r: Extract<RateLimitResult, { ok: false }>): string {
  return r.reason === "too_fast"
    ? `少し早すぎます。${r.retryAfterSec}秒ほど待ってからもう一度お試しください。`
    : `短時間に集中しすぎています。しばらく待ってからお試しください。`
}
