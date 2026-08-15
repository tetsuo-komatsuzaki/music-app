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
    // safe area の面倒は Web 側の CSS が見る (layout.tsx が viewportFit: "cover" を
    // 指定し、globals.css がステータスバー帯を、各ボトムシートが
    // env(safe-area-inset-bottom) を自前で足している)。
    // ここを "always" にすると UIScrollView が上下に safe area を二重に足し、
    // ページ末尾に 34pt の空白が出る (2026-08-16 実機実測: adjusted={62,0,34,0})。
    contentInset: "never",
    backgroundColor: "#F8FAFC",
    // 録音直後のローカルファイル再生 (capacitor://) を使うため
    // App-Bound Domains 制限は掛けない。
    limitsNavigationsToAppBoundDomains: false,
  },
}

export default config
