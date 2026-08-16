// アプリ殻で表示されているとき <html> に data-native-app を立てる (全画面共通)。
// globals.css のステータスバー帯 (セーフエリア確保+ぼかし層) がこれを参照する。
// Webブラウザでは何もしない。ARC-SPEC-NATIVE-1.0 (2026-08-16)。
"use client"

import { useEffect } from "react"
import { isNativeApp } from "@/app/_libs/isNativeApp"
import { listenAuthCallback } from "@/app/_libs/arcodaAuthBrowser"

export default function NativeChrome() {
  useEffect(() => {
    if (isNativeApp()) {
      document.documentElement.setAttribute("data-native-app", "true")
      // Googleログインのアプリ復帰 (arcoda://auth-callback) を監視 (§9b)
      listenAuthCallback()
    }
    // 起動スプラッシュ(ArcoBootSplash)を消す: ハイドレーション完了=アプリ操作可能の合図。
    // Web版ではCSSで非表示だが、DOMごと除去して後始末する。
    const boot = document.getElementById("arco-boot")
    if (boot) {
      boot.classList.add("abOut")
      window.setTimeout(() => boot.remove(), 500)
    }
  }, [])
  return null
}
