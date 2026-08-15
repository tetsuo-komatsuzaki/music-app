import type { CapacitorConfig } from "@capacitor/cli"

/**
 * ARC-SPEC-NATIVE-1.0 / Phase 1
 *
 * remote URL 方式: アプリは https://arcodaviolin.com を表示するだけの殻。
 * UI 更新は Vercel デプロイのみで Web / アプリ同時反映され、審査再提出は
 * この殻またはネイティブプラグインを変更したときだけ必要になる。
 *
 * webDir の www/ は「サイトに到達できないとき」の案内ページ置き場で、
 * 通常のフローでは読み込まれない。
 */
const config: CapacitorConfig = {
  appId: "com.arcodaviolin.app",
  appName: "アルコ",
  webDir: "www",
  server: {
    url: "https://arcodaviolin.com",
    cleartext: false,
    // 自サイト内の遷移のみ WebView 内で扱う。外部リンク (SNS 等) は
    // OS ブラウザに開かせたいので allowNavigation には追加しない。
    allowNavigation: ["arcodaviolin.com", "*.arcodaviolin.com"],
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#ffffff",
    // 録音直後のローカルファイル再生 (capacitor://) を使うため
    // App-Bound Domains 制限は掛けない。
    limitsNavigationsToAppBoundDomains: false,
  },
}

export default config
