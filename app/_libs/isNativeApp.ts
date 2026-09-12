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
 * いま開いている場所で「アルコプラスをはじめる」導線を出してよいか (要件整理 v2.7 §3 U-13)。
 * - NEXT_PUBLIC_BILLING_MODE=apple: iOS のアプリ内だけ true。Web では売らない
 * - それ以外 (stripe・従来): Web だけ true。iOS では出さない (審査ガイドライン 3.1.1)
 * 切り替えは環境変数だけ。ローンチ前の本番は stripe のまま、既存の利用者に影響を出さない。
 */
export function canShowBillingEntryPoint(): boolean {
  const apple = process.env.NEXT_PUBLIC_BILLING_MODE === "apple"
  return apple ? isNativeApp() : !isNativeApp()
}

/**
 * サーバーで描いた HTML の中で「殻のときだけ / Web のときだけ」を CSS で出し分けるための起動スクリプト。
 * Capacitor のブリッジは document start で注入されるので、body の先頭で読めば最初の描画前に決まる (ハイドレーション不一致なし)。
 * 使い方: <script dangerouslySetInnerHTML={{ __html: NATIVE_BOOT_SCRIPT }} /> を置き、
 *   html[data-native-boot] .webOnly { display:none } / html:not([data-native-boot]) .nativeOnly { display:none } で切り替える。
 */
export const NATIVE_BOOT_SCRIPT =
  "try{var c=window.Capacitor;if(c&&typeof c.isNativePlatform==='function'&&c.isNativePlatform())document.documentElement.setAttribute('data-native-boot','1')}catch(e){}"
