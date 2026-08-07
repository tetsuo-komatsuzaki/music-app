// 課金プラン判定 + 週境界 のユニットテスト (2026-08-07 Phase 1)
import { describe, expect, it } from "vitest"
import { EXISTING_USER_GRACE_DAYS, jstWeekStart, resolveEffectivePlan } from "./plan"

// JST の壁時計で Date を作るヘルパ (JST = UTC+9)
function jst(y: number, mo: number, d: number, h = 0, mi = 0): Date {
  return new Date(Date.UTC(y, mo - 1, d, h - 9, mi))
}

describe("jstWeekStart (JST 月曜 0:00 リセット)", () => {
  // 2026-08-03 は月曜
  it("週の途中 (木曜) はその週の月曜 0:00 JST", () => {
    expect(jstWeekStart(jst(2026, 8, 6, 15, 30))).toEqual(jst(2026, 8, 3))
  })

  it("月曜 0:00 JST ちょうどは新しい週の開始", () => {
    expect(jstWeekStart(jst(2026, 8, 3, 0, 0))).toEqual(jst(2026, 8, 3))
  })

  it("日曜 23:59 JST はまだ前の週", () => {
    expect(jstWeekStart(jst(2026, 8, 9, 23, 59))).toEqual(jst(2026, 8, 3))
  })

  it("UTC ではまだ日曜でも JST で月曜なら新しい週 (UTC日曜16:00 = JST月曜1:00)", () => {
    const utcSunday = new Date(Date.UTC(2026, 7, 9, 16, 0)) // JST 8/10(月) 1:00
    expect(jstWeekStart(utcSunday)).toEqual(jst(2026, 8, 10))
  })

  it("JST 日曜昼 (UTC 日曜早朝) は前の月曜に戻る", () => {
    expect(jstWeekStart(jst(2026, 8, 9, 12, 0))).toEqual(jst(2026, 8, 3))
  })
})

describe("resolveEffectivePlan", () => {
  const base = { createdAt: jst(2026, 1, 1), restrictionStart: null }

  it("サブスクなしは free", () => {
    expect(resolveEffectivePlan({ ...base, plan: null, planStatus: null })).toBe("free")
  })

  it.each(["trialing", "active", "past_due"])("planStatus=%s は plus", (s) => {
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: s })).toBe("plus")
  })

  it.each(["canceled", "unpaid", "incomplete_expired"])("planStatus=%s は free", (s) => {
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: s })).toBe("free")
  })

  it("plan が plus でも planStatus が無ければ free (webhook 未反映の中途半端な状態は課金扱いしない)", () => {
    expect(resolveEffectivePlan({ ...base, plan: "plus", planStatus: null })).toBe("free")
  })

  describe("既存ユーザー猶予 (制限開始日から30日)", () => {
    const restrictionStart = jst(2026, 9, 1)

    it("制限開始前に登録した既存ユーザーは、開始から30日間 plus 扱い", () => {
      expect(
        resolveEffectivePlan({
          plan: null, planStatus: null,
          createdAt: jst(2026, 8, 1),
          now: jst(2026, 9, 15),
          restrictionStart,
        }),
      ).toBe("plus")
    })

    it("猶予30日を過ぎたら free", () => {
      expect(
        resolveEffectivePlan({
          plan: null, planStatus: null,
          createdAt: jst(2026, 8, 1),
          now: jst(2026, 9, 1 + EXISTING_USER_GRACE_DAYS, 0, 1),
          restrictionStart,
        }),
      ).toBe("free")
    })

    it("制限開始後に登録した新規ユーザーに猶予はない", () => {
      expect(
        resolveEffectivePlan({
          plan: null, planStatus: null,
          createdAt: jst(2026, 9, 2),
          now: jst(2026, 9, 3),
          restrictionStart,
        }),
      ).toBe("free")
    })

    it("restrictionStart=null (未発動) の間は猶予も発生しない", () => {
      expect(
        resolveEffectivePlan({
          plan: null, planStatus: null,
          createdAt: jst(2026, 8, 1),
          now: jst(2026, 9, 15),
          restrictionStart: null,
        }),
      ).toBe("free")
    })
  })
})
