import { describe, it, expect } from "vitest"
import { normalizeNoteName, displayNoteName } from "./noteName"

describe("音名の表記 (music21 の '-' フラット)", () => {
  it("normalize: '-' や ♭/♯ を内部表記 b/# にそろえる", () => {
    expect(normalizeNoteName("B-3")).toBe("Bb3")
    expect(normalizeNoteName("B♭4")).toBe("Bb4")
    expect(normalizeNoteName("Bb4")).toBe("Bb4")
    expect(normalizeNoteName("C#5")).toBe("C#5")
    expect(normalizeNoteName("C♯5")).toBe("C#5")
    expect(normalizeNoteName("E--4")).toBe("Ebb4")
    expect(normalizeNoteName("A4")).toBe("A4")
    expect(normalizeNoteName("unknown")).toBe("unknown")
  })
  it("display: ♭ ♯ で見せる", () => {
    expect(displayNoteName("B-3")).toBe("B♭3")
    expect(displayNoteName("F#4")).toBe("F♯4")
    expect(displayNoteName("D4")).toBe("D4")
  })
})
