import { describe, it, expect } from "vitest"
import { modeToJa, formatKey, tonicToJa } from "./musicNotation"

describe("modeToJa", () => {
  it("既知の mode を日本語に", () => {
    expect(modeToJa("major")).toBe("長調")
    expect(modeToJa("minor")).toBe("短調")
    expect(modeToJa("chromatic")).toBe("半音階")
  })
  it("未知/空は素通し", () => {
    expect(modeToJa("dorian")).toBe("dorian")
    expect(modeToJa(null)).toBe("")
    expect(modeToJa(undefined)).toBe("")
  })
})

describe("formatKey", () => {
  it("tonic + mode を組み立て", () => {
    expect(formatKey("F#", "major")).toBe("F# 長調")
    expect(formatKey("Bb", "minor")).toBe("Bb 短調")
    expect(formatKey("C", "chromatic")).toBe("C 半音階")
  })
  it("片方だけでも対応", () => {
    expect(formatKey("C", null)).toBe("C")
    expect(formatKey(null, "major")).toBe("長調")
    expect(formatKey(null, null)).toBe("")
  })
})

describe("tonicToJa", () => {
  it("英字はそのまま、null は空", () => {
    expect(tonicToJa("F#")).toBe("F#")
    expect(tonicToJa(null)).toBe("")
  })
})
