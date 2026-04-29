"use client"

import { Component, ErrorInfo, ReactNode } from "react"

type Props = {
  children: ReactNode
  /** エラー発生時に描画する代替 UI。省略時は null (= 何も描画しない) */
  fallback?: ReactNode
}
type State = { hasError: boolean }

/**
 * オンボーディング機能 (Provider/Welcome/HelpModal/CoachMark/Trigger) のクラッシュから
 * 既存ページを保護する境界。
 * クラッシュ時は children を破棄し、fallback (なければ null) を描画する。
 */
export default class OnboardingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Onboarding] crashed, suppressing subtree:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
