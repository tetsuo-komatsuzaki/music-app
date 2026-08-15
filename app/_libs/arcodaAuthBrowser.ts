// ARC-SPEC-NATIVE-1.0 §9b — アプリ内認証ブラウザの型付きクライアント。
//
// GoogleログインをWKWebView内で行うとSafariへ逃げる/Google規約違反になるため、
// アプリでは認証専用ブラウザ (SFSafariViewController = @capacitor/browser) で開き、
// Supabaseの redirect_to を arcoda://auth-callback にしてアプリへ戻す。
// 戻りの appUrlOpen は NativeChrome が受けて既存の /auth/callback へ流す
// (PKCE検証キーはWebViewのCookieにあるため、既存ルートがそのまま交換できる)。

import { getCapacitor, isNativeApp } from "./isNativeApp"

function call<T>(plugin: string, method: string, options?: unknown): Promise<T> | null {
  const cap = getCapacitor()
  if (!cap || !isNativeApp()) return null
  if (typeof cap.nativePromise !== "function") return null
  return cap.nativePromise(plugin, method, options ?? {}) as Promise<T>
}

/** 認証専用のアプリ内ブラウザでURLを開く。プラグイン不在時は false */
export async function openAuthBrowser(url: string): Promise<boolean> {
  const p = call("Browser", "open", { url })
  if (!p) return false
  try {
    await p
    return true
  } catch {
    return false
  }
}

/** 認証ブラウザを閉じる。冪等・失敗無視 */
export async function closeAuthBrowser(): Promise<void> {
  const p = call("Browser", "close")
  if (!p) return
  try {
    await p
  } catch {
    /* noop */
  }
}

/** アプリのディープリンク (arcoda://auth-callback?code=...) 監視を開始する。
 *  NativeChrome から1回だけ呼ぶ。Web版ではNOOP */
export function listenAuthCallback(): void {
  const cap = getCapacitor()
  if (!cap || !isNativeApp()) return
  if (typeof cap.addListener !== "function") return
  cap.addListener("App", "appUrlOpen", (data: never) => {
    const url = (data as { url?: string })?.url ?? ""
    if (!url.startsWith("arcoda://auth-callback")) return
    void closeAuthBrowser()
    const qs = url.split("?")[1] ?? ""
    // 既存の /auth/callback (route.ts) がPKCE交換とホーム遷移を担う
    window.location.href = "/auth/callback" + (qs ? "?" + qs : "")
  })
}
