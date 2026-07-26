// 祝い表示の Error Boundary (祝い体験 v2.0 §2.3 / B-4対策)。
// お祝い描画が例外を投げても、振り返り(結果)画面自体は必ず表示されるよう、ここで握りつぶす。
// フォールバック = 何も描かない(= 背後の通常結果が見える)。
"use client"

import React from "react"

type Props = { children: React.ReactNode; onError?: (e: unknown) => void }
type State = { failed: boolean }

export default class CelebrationBoundary extends React.Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // 観測性(§7): 発火失敗をログ
    console.error("[celebration] render failed, fell back to normal result:", error)
    this.props.onError?.(error)
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
