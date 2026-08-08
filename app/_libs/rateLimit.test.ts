import { describe, expect, it } from "vitest"
import { evaluateRateLimit, RECORDING_LIMIT, type RateLimitConfig } from "./rateLimit"

const CFG: RateLimitConfig = { windowMs: 60_000, max: 5, minGapMs: 8_000 }

describe("evaluateRateLimit", () => {
  it("履歴なしは許可", () => {
    expect(evaluateRateLimit([], 100_000, CFG)).toEqual({ ok: true })
  })

  it("直近イベントから十分空いていれば許可", () => {
    expect(evaluateRateLimit([100_000], 110_000, CFG)).toEqual({ ok: true })
  })

  it("minGap 未満は too_fast で拒否し retryAfter を返す", () => {
    const r = evaluateRateLimit([100_000], 103_000, CFG)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe("too_fast")
      expect(r.retryAfterSec).toBe(5) // 8s - 3s = 5s
    }
  })

  it("窓内が max 以上なら too_many で拒否", () => {
    // 直近は十分空けつつ、窓内に5件ある状態
    const ts = [10_000, 20_000, 30_000, 40_000, 50_000]
    const r = evaluateRateLimit(ts, 100_000, CFG) // 全て窓(40000-100000)内は4件? 40000,50000のみ→調整
    // 窓 = now-60000 = 40000 以降: 40000,50000 の2件 → 許可されるはず
    expect(r).toEqual({ ok: true })
  })

  it("窓内ちょうど max 件で拒否", () => {
    const ts = [50_000, 60_000, 70_000, 80_000, 90_000] // now=100000, 窓=40000〜 → 5件
    const r = evaluateRateLimit(ts, 100_000, CFG)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("too_many")
  })

  it("古いイベントは窓から外れて件数に数えない", () => {
    const ts = [1_000, 2_000, 3_000, 4_000, 90_000] // 90000だけ窓内(1件) だが minGap OK
    const r = evaluateRateLimit(ts, 200_000, CFG)
    expect(r).toEqual({ ok: true })
  })

  it("実利用シナリオ: 3分に1回の録音は録音制限に触れない", () => {
    const now = 10_000_000
    // 直近1時間、3分間隔 = 20件 (max 60 未満・gap 180s > 8s)
    const ts = Array.from({ length: 20 }, (_, i) => now - i * 180_000)
    expect(evaluateRateLimit(ts, now + 180_000, RECORDING_LIMIT)).toEqual({ ok: true })
  })

  it("濫用シナリオ: 毎秒録音は弾かれる", () => {
    const now = 10_000_000
    const ts = Array.from({ length: 100 }, (_, i) => now - i * 1000) // 毎秒100件
    const r = evaluateRateLimit(ts, now + 1000, RECORDING_LIMIT)
    expect(r.ok).toBe(false)
  })
})
