import { describe, it, expect } from "vitest"
import { mapReturnToForUser, safeReturnPath } from "./returnTo"

describe("returnTo ・ ゲートで止めた場所へ戻す", () => {
  it("サイト内の絶対パスだけ受け取る", () => {
    expect(safeReturnPath("/guest/scores/abc")).toBe("/guest/scores/abc")
    expect(safeReturnPath("%2Fguest%2Flibrary%3Ftab%3Dbasics")).toBe("/guest/library?tab=basics")
    expect(safeReturnPath("https://evil.example/")).toBeNull()
    expect(safeReturnPath("//evil.example")).toBeNull()
    expect(safeReturnPath("/a b")).toBeNull()
    expect(safeReturnPath("")).toBeNull()
    expect(safeReturnPath(null)).toBeNull()
  })
  it("/guest を本人の ID に置き換える (それ以外はそのまま)", () => {
    expect(mapReturnToForUser("/guest", "u1")).toBe("/u1")
    expect(mapReturnToForUser("/guest/scores/abc?x=1", "u1")).toBe("/u1/scores/abc?x=1")
    expect(mapReturnToForUser("/guestbook", "u1")).toBe("/guestbook")
    expect(mapReturnToForUser("/u9/library", "u1")).toBe("/u9/library")
  })
})
