// @vitest-environment jsdom
//
// カイザー No.1 の実データ (2026-09-01 本番) をそのまま流し込み、
// 練習前シートが「リズム変種をパターン欄に出す」「奏法で選んだ通しのパートを出す」
// ことを実マウントで担保する。名前での突き合わせに戻したら落ちる。
import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, cleanup, fireEvent } from "@testing-library/react"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("./SheetPreview", () => ({ default: () => null }))
vi.mock("./SheetSkills", () => ({ default: () => null }))

import PrePracticeSheet, { type SheetVariant } from "./PrePracticeSheet"

const v = (o: Partial<SheetVariant> & { id: string }): SheetVariant => ({
  star: 2, difficulty: null, articulation: null, patternName: null,
  partId: null, partName: null, sourceItemId: null, sections: [], bestScore: null, ...o,
})

// 通し / 奏法変種 / リズム変種 / それぞれのパート
const TOSHI = v({ id: "toshi" })
const SLUR = v({ id: "slur", articulation: "slur", patternName: "スラー" })
const R16 = v({ id: "r16", patternName: "16音符" })
const parts = (src: string, art: string | null, pat: string | null) =>
  [1, 2, 3, 4].map((n) => v({
    id: `${src}-p${n}`, partId: `part-${n}`, partName: `Part${n}`,
    articulation: art, patternName: pat, sourceItemId: src,
  }))

const group = {
  title: "カイザー 練習曲 Op.20 No.1", composer: "カイザー", genre: null, coverImagePath: null,
  variants: [TOSHI, SLUR, R16, ...parts("toshi", null, null), ...parts("slur", "slur", "スラー"), ...parts("r16", null, "16音符")],
}

const open = () => render(
  <PrePracticeSheet userId="u1" group={group} onClose={() => {}}
    basePath="/practice/etude" primaryAxis="articulation" />,
)
const selects = () => Array.from(document.querySelectorAll("select")) as HTMLSelectElement[]
const optionTexts = (s: HTMLSelectElement) => Array.from(s.options).map((o) => o.textContent ?? "")

afterEach(cleanup)

describe("練習前シート (エチュード・奏法軸)", () => {
  it("リズム変種がパターン欄に出る", () => {
    open()
    expect(screen.getByText("パターンを選ぶ")).toBeTruthy()
    const pat = selects()[1]
    expect(optionTexts(pat).some((t) => t.includes("16音符"))).toBe(true)
  })

  it("奏法=スラー で スラーのパートが4つ出る (準備中にならない)", () => {
    open()
    fireEvent.change(selects()[0], { target: { value: "slur" } })
    const part = selects().at(-1)!
    // パート欄が「準備中」の固定文言ではなく、選べるセレクトになっている
    expect(part.options.length).toBeGreaterThan(1)
    expect(optionTexts(part).filter((t) => t.startsWith("Part")).length).toBe(4)
  })

  it("パターン=16音符 で 16音符のパートに切り替わる", () => {
    open()
    fireEvent.change(selects()[1], { target: { value: "r16" } })
    const part = selects().at(-1)!
    expect(optionTexts(part).filter((t) => t.startsWith("Part")).length).toBe(4)
  })

  it("教材の無いスラーは選択肢に出さない (一括生成の対象外のため)", () => {
    render(
      <PrePracticeSheet userId="u1" onClose={() => {}} basePath="/practice/etude" primaryAxis="articulation"
        group={{ ...group, variants: [TOSHI, ...parts("toshi", null, null)] }} />,
    )
    expect(optionTexts(selects()[0]).some((t) => t.includes("スラー"))).toBe(false)
    expect(optionTexts(selects()[0]).some((t) => t.includes("スタッカート"))).toBe(true)
  })
})
