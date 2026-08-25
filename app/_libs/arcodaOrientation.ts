// ARC-SPEC-NATIVE-1.0 §9a — 画面向きロックの型付きクライアント。
//
// 殻に @capacitor/screen-orientation が同梱されているときだけ動き、
// Web版・プラグイン未同梱の殻では NOOP (false/即resolve) に倒れる。
// 呼び出し側は「ロック成功したときだけ横画面録音モードにする」フォールバック設計
// (docs/native-app-9a-implementation-plan.md §2-26: 解除は6経路+冪等)。

import { getCapacitor, isNativeApp } from "./isNativeApp"

const PLUGIN = "ScreenOrientation"

function call<T>(method: string, options?: unknown): Promise<T> | null {
  const cap = getCapacitor()
  if (!cap || !isNativeApp()) return null
  if (typeof cap.nativePromise !== "function") return null
  if (typeof cap.isPluginAvailable === "function" && !cap.isPluginAvailable(PLUGIN)) return null
  return cap.nativePromise(PLUGIN, method, options ?? {}) as Promise<T>
}

/** 横固定を試みる。プラグイン不在・失敗時は false (=縦のまま録音続行) */
export async function lockLandscape(): Promise<boolean> {
  const p = call("lock", { orientation: "landscape" })
  if (!p) return false
  try {
    await p
    return true
  } catch {
    return false
  }
}

/**
 * 縦固定を試みる (2026-08-25 Tetsuo「録音のとき以外は横にしない」)。
 * アプリは横向きレイアウトを持たないため、回ると崩れる。
 * プラグイン不在・失敗時は false (=OSに任せる)。
 */
export async function lockPortrait(): Promise<boolean> {
  const p = call("lock", { orientation: "portrait" })
  if (!p) return false
  try {
    await p
    return true
  } catch {
    return false
  }
}

/** 向きロック解除。冪等・失敗無視。どの終了経路からでも安全に呼べる */
export async function unlockOrientation(): Promise<void> {
  const p = call("unlock")
  if (!p) return
  try {
    await p
  } catch {
    /* noop */
  }
}
