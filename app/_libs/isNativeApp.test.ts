// 課金導線のスイッチ (要件整理 v2.7 §3: apple モードは iOS だけ true・stripe は Web だけ true)。2026-09-13 検証ループ
import { afterEach, describe, expect, it, vi } from "vitest"

const g = globalThis as unknown as { window?: { Capacitor?: unknown } }

async function load(mode: string | undefined, native: boolean) {
  vi.resetModules()
  if (mode === undefined) delete process.env.NEXT_PUBLIC_BILLING_MODE
  else process.env.NEXT_PUBLIC_BILLING_MODE = mode
  if (native) g.window = { Capacitor: { isNativePlatform: () => true, getPlatform: () => "ios" } }
  else delete g.window
  return import("./isNativeApp")
}

afterEach(() => {
  delete g.window
  delete process.env.NEXT_PUBLIC_BILLING_MODE
})

describe("canShowBillingEntryPoint", () => {
  it("apple モード: 殻の中だけ true", async () => {
    expect((await load("apple", true)).canShowBillingEntryPoint()).toBe(true)
    expect((await load("apple", false)).canShowBillingEntryPoint()).toBe(false)
  })
  it("stripe モード (未設定): Web だけ true。本番の現状はこちら", async () => {
    expect((await load(undefined, false)).canShowBillingEntryPoint()).toBe(true)
    expect((await load(undefined, true)).canShowBillingEntryPoint()).toBe(false)
  })
  it("明示の stripe も未設定と同じ", async () => {
    expect((await load("stripe", false)).canShowBillingEntryPoint()).toBe(true)
    expect((await load("stripe", true)).canShowBillingEntryPoint()).toBe(false)
  })
})

describe("isNativeApp", () => {
  it("window が無い (サーバー) は false", async () => {
    expect((await load(undefined, false)).isNativeApp()).toBe(false)
  })
  it("ブリッジの isNativePlatform を信じる", async () => {
    expect((await load(undefined, true)).isNativeApp()).toBe(true)
  })
  it("isNativePlatform が無くても platform ios なら true", async () => {
    vi.resetModules()
    g.window = { Capacitor: { getPlatform: () => "ios" } }
    expect((await import("./isNativeApp")).isNativeApp()).toBe(true)
  })
})

describe("NATIVE_BOOT_SCRIPT (描画前の殻の印)", () => {
  it("殻では html に data-native-boot を立て、Web では何もしない", async () => {
    const { NATIVE_BOOT_SCRIPT } = await load(undefined, false)
    const calls: string[] = []
    const run = (cap: unknown) => {
      const fn = new Function("window", "document", NATIVE_BOOT_SCRIPT)
      fn({ Capacitor: cap }, { documentElement: { setAttribute: (k: string, v: string) => calls.push(`${k}=${v}`) } })
    }
    run({ isNativePlatform: () => true }); expect(calls).toEqual(["data-native-boot=1"])
    calls.length = 0
    run(undefined); expect(calls).toEqual([])
    run({ isNativePlatform: () => false }); expect(calls).toEqual([])
  })
})
