// @vitest-environment jsdom
//
// 【Tetsuo徹底事項】ガイドの透明カバーがチュートリアル終了後に画面へ残り、
// タップを妨害する事故を構造的に防ぐ。step=null で DOM から完全に消えることを
// 実マウントで担保する (opacity で隠すだけの実装が紛れ込んだら落ちる)。

import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import GuideOverlay from "./GuideOverlay"
import { FIRST_LOOP } from "./guideFlow"

afterEach(cleanup)

describe("GuideOverlay (アルコと最初の1周)", () => {
  it("step=null では何も描画しない (透明カバー残留の禁止)", () => {
    const { container } = render(<GuideOverlay step={null} onSkip={() => {}} />)
    expect(container.querySelector("[data-guide-overlay]")).toBeNull()
    expect(container.innerHTML).toBe("")
  })

  it("ガイド終了 (step→null) で層ごと DOM から消える", () => {
    const { container, rerender } = render(
      <GuideOverlay step={FIRST_LOOP[0]} onSkip={() => {}} />,
    )
    expect(container.querySelector("[data-guide-overlay]")).not.toBeNull()
    rerender(<GuideOverlay step={null} onSkip={() => {}} />)
    expect(container.querySelector("[data-guide-overlay]")).toBeNull()
    expect(container.innerHTML).toBe("")
  })

  it("表示中も操作を受けるのはボタンだけ (暗幕・光は装飾)", () => {
    const { container } = render(
      <GuideOverlay step={FIRST_LOOP[0]} onSkip={() => {}} />,
    )
    // 対話要素は スキップ ボタンのみ (ガイドカードは children で渡された場合のみ増える)
    const buttons = container.querySelectorAll("button")
    expect(buttons.length).toBe(1)
    expect(buttons[0].textContent).toBe("スキップ")
    // 暗幕・光・灰枠は aria-hidden の装飾ノード
    container.querySelectorAll("[aria-hidden]").forEach((el) => {
      expect(el.tagName).toBe("DIV")
    })
  })
})
