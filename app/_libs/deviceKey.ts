// 端末の識別子 (2026-09-12 要件整理 v2.7 §1)。「1 回ためし」を数えるためだけに使う。
// アプリ版は殻の ArcodaStore プラグインが identifierForVendor を返す。無ければブラウザの記録 (localStorage) に乱数を置く。
// 再インストールで復活するのは許容 (解析 1 本分のコストが上限)。
import { getCapacitor, isNativeApp } from "./isNativeApp"

const KEY = "arcoda_device_key"

function randomKey(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === "function") return "web-" + c.randomUUID()
  return "web-" + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function getDeviceKey(): Promise<string> {
  const cap = getCapacitor()
  if (cap && isNativeApp() && typeof cap.nativePromise === "function") {
    try {
      const r = (await cap.nativePromise("ArcodaStore", "deviceKey", {})) as { key?: string }
      if (r?.key && r.key.length >= 8) return "ios-" + r.key
    } catch { /* 下へ */ }
  }
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return saved
    const k = randomKey()
    localStorage.setItem(KEY, k)
    return k
  } catch {
    return randomKey()
  }
}
