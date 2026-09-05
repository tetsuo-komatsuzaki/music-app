// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { usePress } from "./usePress"

function Btn({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const p = usePress(onPress)
  return <button {...p} disabled={disabled}>採点</button>
}
afterEach(cleanup)

describe("usePress ・ 長く押しても離せば動く", () => {
  it("pointerdown → (長く待って) pointerup で1回動き、直後の click は二重に動かない", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    const b = getByText("採点")
    fireEvent.pointerDown(b, { pointerId: 1, clientX: 10, clientY: 10, pointerType: "touch" })
    fireEvent.pointerUp(b, { pointerId: 1, clientX: 11, clientY: 12, pointerType: "touch" })
    fireEvent.click(b)
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("指が大きく動いたら動かない (スクロール)", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    const b = getByText("採点")
    fireEvent.pointerDown(b, { pointerId: 1, clientX: 10, clientY: 10, pointerType: "touch" })
    fireEvent.pointerUp(b, { pointerId: 1, clientX: 10, clientY: 60, pointerType: "touch" })
    expect(fn).not.toHaveBeenCalled()
  })
  it("click だけ (キーボード・element.click()) でも動く", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    fireEvent.click(getByText("採点"))
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("disabled なら pointerup でも動かない", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} disabled />)
    const b = getByText("採点")
    fireEvent.pointerDown(b, { pointerId: 1, clientX: 0, clientY: 0, pointerType: "touch" })
    fireEvent.pointerUp(b, { pointerId: 1, clientX: 0, clientY: 0, pointerType: "touch" })
    expect(fn).not.toHaveBeenCalled()
  })
})
