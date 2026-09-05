// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { usePress } from "./usePress"

function Btn({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const p = usePress(onPress)
  return <button {...p} disabled={disabled}>採点</button>
}
afterEach(cleanup)
const touch = (x: number, y: number) => ({ clientX: x, clientY: y, identifier: 0 })

describe("usePress ・ 長く押しても離せば動く", () => {
  it("touchstart → (長く待って) touchend で1回動き、直後の click は二重に動かない", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    const b = getByText("採点")
    fireEvent.touchStart(b, { touches: [touch(10, 10)] })
    fireEvent.touchEnd(b, { changedTouches: [touch(11, 12)], touches: [] })
    fireEvent.click(b)
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("touchstart の既定動作を止める (iOS の長押しジェスチャを始めさせない)", () => {
    const { getByText } = render(<Btn onPress={() => {}} />)
    const b = getByText("採点")
    const ev = new TouchEvent("touchstart", { cancelable: true, touches: [touch(10, 10) as unknown as Touch] } as TouchEventInit)
    b.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })
  it("OS がタッチ列を打ち切っても (touchcancel)、指が動いていなければ動く", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    const b = getByText("採点")
    fireEvent.touchStart(b, { touches: [touch(10, 10)] })
    fireEvent.touchCancel(b, { touches: [], changedTouches: [] })
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("指が大きく動いたら動かない (スクロール)。打ち切られても同じ", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    const b = getByText("採点")
    fireEvent.touchStart(b, { touches: [touch(10, 10)] })
    fireEvent.touchMove(b, { touches: [touch(10, 60)] })
    fireEvent.touchEnd(b, { changedTouches: [touch(10, 60)], touches: [] })
    fireEvent.touchStart(b, { touches: [touch(10, 10)] })
    fireEvent.touchMove(b, { touches: [touch(10, 60)] })
    fireEvent.touchCancel(b, { touches: [], changedTouches: [] })
    expect(fn).not.toHaveBeenCalled()
  })
  it("click だけ (マウス・キーボード・element.click()) でも動く", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} />)
    fireEvent.click(getByText("採点"))
    expect(fn).toHaveBeenCalledTimes(1)
  })
  it("disabled なら touchend でも動かない", () => {
    const fn = vi.fn()
    const { getByText } = render(<Btn onPress={fn} disabled />)
    const b = getByText("採点")
    fireEvent.touchStart(b, { touches: [touch(0, 0)] })
    fireEvent.touchEnd(b, { changedTouches: [touch(0, 0)], touches: [] })
    expect(fn).not.toHaveBeenCalled()
  })
  it("最新の onPress が呼ばれる (再レンダー後も古い関数に固定されない)", () => {
    const a = vi.fn(), b2 = vi.fn()
    const { getByText, rerender } = render(<Btn onPress={a} />)
    rerender(<Btn onPress={b2} />)
    const b = getByText("採点")
    fireEvent.touchStart(b, { touches: [touch(0, 0)] })
    fireEvent.touchEnd(b, { changedTouches: [touch(0, 0)], touches: [] })
    expect(a).not.toHaveBeenCalled()
    expect(b2).toHaveBeenCalledTimes(1)
  })
})
