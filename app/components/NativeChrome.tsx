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
  }, [])
  return null
}
