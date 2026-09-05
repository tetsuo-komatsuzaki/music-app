// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import PressButton from "./PressButton"

afterEach(cleanup)
const touch = (x: number, y: number) => ({ clientX: x, clientY: y, identifier: 0 })

describe("PressButton", () => {
  it("長押しで OS がタッチを打ち切っても動く / className・disabled はそのまま通る", () => {
    const fn = vi.fn()
    const { getByText } = render(<PressButton className="x" onPress={fn}>通しで録音</PressButton>)
    const b = getByText("通しで録音")
    expect(b.className).toBe("x")
    expect(b.getAttribute("type")).toBe("button")
    fireEvent.touchStart(b, { touches: [touch(5, 5)] })
    fireEvent.touchCancel(b, { touches: [], changedTouches: [] })
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("disabled なら動かない", () => {
    const fn = vi.fn()
    const { getByText } = render(<PressButton disabled onPress={fn}>区間録音</PressButton>)
    const b = getByText("区間録音")
    fireEvent.touchStart(b, { touches: [touch(5, 5)] })
    fireEvent.touchEnd(b, { changedTouches: [touch(5, 5)], touches: [] })
    fireEvent.click(b)
    expect(fn).not.toHaveBeenCalled()
  })
})
