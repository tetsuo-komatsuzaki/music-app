// @vitest-environment jsdom
//
// PageCoachMarks を実際にマウントし、「新規ユーザーでガイドが出るか」を再現する。
// 状態機械リファクタ後の非表示バグを、推測でなく実マウントで確定させるため。

import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, cleanup, waitFor } from "@testing-library/react"
import { OnboardingContext, type OnboardingContextValue } from "./OnboardingProvider"
import PageCoachMarks from "./PageCoachMarks"
import type { CoachMarkConfig } from "./content/coachMarks"

// next/navigation をモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/u/scores",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const baseCtx = (over: Partial<OnboardingContextValue> = {}): OnboardingContextValue => ({
  welcomeSlidesShown: true,
  allGuidesDismissed: false,
  pageGuidesSeen: new Set<string>(),
  firstAnalysisGuideShown: false,
  isHydrated: true,
  analysisOverlayRenderedAt: null,
  replayingPageKey: null,
  guideSample: null,
  setGuideSample: vi.fn(),
  activeGuideMarkIdRef: { current: null },
  setActiveGuideMarkId: vi.fn(),
  onboardingSamplePiece: null,
  setOnboardingSamplePiece: vi.fn(),
  helpOpen: false,
  helpSection: null,
  markWelcomeSlidesShown: vi.fn(),
  markPageGuideSeen: vi.fn(),
  markFirstAnalysisGuideShown: vi.fn(),
  dismissAllGuides: vi.fn(),
  resetAll: vi.fn(),
  markAnalysisOverlayRendered: vi.fn(),
  replayPageGuide: vi.fn(),
  clearReplayingPageKey: vi.fn(),
  openHelp: vi.fn(),
  closeHelp: vi.fn(),
  ...over,
})

const marksNoTarget: CoachMarkConfig[] = [
  { id: "p.a", targetKey: null, headline: "見出しA", body: "本文A", trigger: "page", showDismissAllCheckbox: true },
  { id: "p.b", targetKey: null, headline: "見出しB", body: "本文B", trigger: "page", showDismissAllCheckbox: false },
]

function renderWith(ctx: OnboardingContextValue, marks = marksNoTarget) {
  return render(
    <OnboardingContext.Provider value={ctx}>
      <PageCoachMarks pageKey="scores" marks={marks} />
    </OnboardingContext.Provider>,
  )
}

// jsdom は scrollIntoView / ResizeObserver 未実装。実ブラウザには在るのでスタブする
// (これが無いと CoachMark 描画時に throw して「出ない」ように見える = 偽陰性)
beforeEach(() => {
  cleanup()
  Element.prototype.scrollIntoView = () => {}
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe("PageCoachMarks (実マウント)", () => {
  it("新規ユーザー: 初回訪問で最初のマークが表示される", async () => {
    renderWith(baseCtx())
    // 開始判定は setTimeout(0..) 経由なので待つ
    await waitFor(() => expect(screen.getByText("見出しA")).toBeTruthy(), { timeout: 2000 })
  })

  it("既読ページでは出ない", async () => {
    renderWith(baseCtx({ pageGuidesSeen: new Set(["scores"]) }))
    await new Promise((r) => setTimeout(r, 900))
    expect(screen.queryByText("見出しA")).toBeNull()
  })

  it("はじめてガイド未完了(welcomeSlidesShown=false)では出ない", async () => {
    renderWith(baseCtx({ welcomeSlidesShown: false }))
    await new Promise((r) => setTimeout(r, 900))
    expect(screen.queryByText("見出しA")).toBeNull()
  })

  it("表示開始時に markPageGuideSeen が1回呼ばれる", async () => {
    const markSeen = vi.fn()
    renderWith(baseCtx({ markPageGuideSeen: markSeen }))
    await waitFor(() => expect(screen.getByText("見出しA")).toBeTruthy(), { timeout: 2000 })
    expect(markSeen).toHaveBeenCalledWith("scores")
  })

  // --- 実シナリオに近い条件 ---

  it("welcomeSlidesShown が false→true に変わったら出る (はじめてガイド完了後)", async () => {
    const ctx0 = baseCtx({ welcomeSlidesShown: false })
    const { rerender } = renderWith(ctx0)
    await new Promise((r) => setTimeout(r, 300))
    expect(screen.queryByText("見出しA")).toBeNull() // まだ出ない
    // スライド完了相当: welcomeSlidesShown=true で再レンダー
    rerender(
      <OnboardingContext.Provider value={baseCtx({ welcomeSlidesShown: true })}>
        <PageCoachMarks pageKey="scores" marks={marksNoTarget} />
      </OnboardingContext.Provider>,
    )
    await waitFor(() => expect(screen.getByText("見出しA")).toBeTruthy(), { timeout: 2000 })
  })

  it("requiresTarget: 対象要素が在れば出る", async () => {
    // 対象要素を DOM に置く
    const host = document.createElement("div")
    host.setAttribute("data-onboarding", "home.pickPiece")
    document.body.appendChild(host)
    const marks: CoachMarkConfig[] = [
      { id: "home.pickPiece", targetKey: "home.pickPiece", headline: "曲を選ぼう", body: "b", trigger: "page", showDismissAllCheckbox: true, requiresTarget: true },
    ]
    renderWith(baseCtx(), marks)
    await waitFor(() => expect(screen.getByText("曲を選ぼう")).toBeTruthy(), { timeout: 2000 })
    host.remove()
  })

  it("requiresAbsent: 指定要素が在れば そのマークは出さない (弾いた人向け)", async () => {
    const host = document.createElement("div")
    host.setAttribute("data-onboarding", "home.pickPiece")
    document.body.appendChild(host)
    const marks: CoachMarkConfig[] = [
      { id: "home.favorites", targetKey: "home.favorites", headline: "お気に入り", body: "b", trigger: "page", showDismissAllCheckbox: true, requiresTarget: true, requiresAbsent: "home.pickPiece" },
    ]
    renderWith(baseCtx(), marks)
    await new Promise((r) => setTimeout(r, 900))
    expect(screen.queryByText("お気に入り")).toBeNull()
    host.remove()
  })

  it("requiresTarget: 対象要素が遅れて出現しても出る (client遷移相当)", async () => {
    const marks: CoachMarkConfig[] = [
      { id: "late", targetKey: "late.target", headline: "遅延ターゲット", body: "b", trigger: "page", showDismissAllCheckbox: true, requiresTarget: true },
    ]
    renderWith(baseCtx(), marks)
    // 200ms 後に対象要素を挿入 (遷移直後は未 commit を模擬)
    setTimeout(() => {
      const el = document.createElement("div")
      el.setAttribute("data-onboarding", "late.target")
      document.body.appendChild(el)
    }, 150)
    await waitFor(() => expect(screen.getByText("遅延ターゲット")).toBeTruthy(), { timeout: 2000 })
  })
})
