// ARC-SPEC-NATIVE-1.0 §1 — Web版 / アプリ版の唯一の判定スイッチ。
//
// アプリは arcodaviolin.com をそのまま表示する殻 (Capacitor の remote URL 方式) なので、
// 同じJSがブラウザでもWKWebView内でも動く。アプリ内だけの分岐は必ずここを経由させ、
// 判定ロジックが各所に散らばらないようにする。
//
// 判定は Capacitor がWebViewへ注入するブリッジ (window.Capacitor) の有無で行う。
// Next.js アプリ側に @capacitor/core を入れる必要はない (Web版のバンドルを太らせない)。

export type NativePlatform = "ios" | "android"

export interface CapacitorBridge {
  getPlatform?: () => string
  isNativePlatform?: () => boolean
  isPluginAvailable?: (name: string) => boolean
  convertFileSrc?: (url: string) => string
  /**
   * 以下は WebView に注入されるブリッジ (native-bridge.js) が持つ低レベルAPI。
   * `registerPlugin` は @capacitor/core 側のAPIで注入ブリッジには**無い**ので、
   * remote URL 方式でプラグインを呼ぶときはこの2つを使う。
   */
  nativePromise?: (pluginName: string, methodName: string, options?: unknown) => Promise<unknown>
  addListener?: (
    pluginName: string,
    eventName: string,
    callback: (data: never) => void,
  ) => { remove: () => Promise<void> }
  /** @capacitor/core を積んだ場合のみ生える */
  registerPlugin?: <T>(name: string) => T
}

/** ブリッジ本体。ブラウザ (Web版) では undefined。 */
export function getCapacitor(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor
}

/**
 * アプリ版(ネイティブの殻)の中で動いているか。
 * サーバー実行時とWeb版ブラウザでは常に false。
 *
 * 注意: この値はサーバーからは判定できないため、これで表示を変える箇所は
 * ハイドレーション不一致を避けるために useIsNativeApp() を使うこと。
 */
export function isNativeApp(): boolean {
  const capacitor = getCapacitor()
  if (!capacitor) return false
  if (typeof capacitor.isNativePlatform === "function") return capacitor.isNativePlatform()
  return getNativePlatform() !== null
}

export function getNativePlatform(): NativePlatform | null {
  const platform = getCapacitor()?.getPlatform?.()
  return platform === "ios" || platform === "android" ? platform : null
}

/**
 * アプリ内でプラン加入導線を出してよいか (審査ガイドライン3.1.1・spec §5)。
 *
 * 初期方針は安全側で「アプリ内は非表示」。既加入者の機能はすべて使えるので、
 * 隠すのは新規加入の導線だけ。スマホ新法の運用状況を見て開放を判断する。
 */
export function canShowBillingEntryPoint(): boolean {
  return !isNativeApp()
}
