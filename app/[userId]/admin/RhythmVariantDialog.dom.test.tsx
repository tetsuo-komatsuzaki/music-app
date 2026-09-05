// @vitest-environment jsdom
//
// リズムパターン変種ダイアログの実マウント (2026-09-05)。
// 3連符 (⅔倍) を選んで拍がぴったり合い「この形で作成」が押せること、重音 (高さを2つ選ぶ) が作れることを担保する。
import { describe, it, expect, afterEach, vi } from "vitest"
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react"

const created: unknown[] = []
vi.mock("@/app/actions/createRhythmVariant", () => ({
  getRhythmContext: async () => ({
    ok: true, title: "テスト教材", beatsPerMeasure: 4, measureCount: 2,
    notesPerMeasure: [8, 8], unitCandidates: [1, 2], sameCountByUnit: { 1: 2, 2: 1 },
    srcNames: ["A4", "B4", "C#5", "D5", "E5", "F#5", "G#5", "A5"], sourceArticulation: null,
  }),
  createRhythmVariant: vi.fn(async (input: unknown) => { created.push(input); return { ok: true, itemId: "new" } }),
}))
vi.mock("./StaffPreview", () => ({ default: () => null }))

import RhythmVariantDialog from "./RhythmVariantDialog"

afterEach(cleanup)

const btn = (label: string | RegExp) => screen.getByRole("button", { name: label })
const clickAdd = () => fireEvent.click(btn(/この音を足す|この音を直す/))

describe("リズムパターンを変える ・ 3連符", () => {
  it("3連8分×12 で 4拍ぴったり になり、作成ボタンが押せて、レシピに triplet が入る", { timeout: 20000 }, async () => {
    render(<RhythmVariantDialog itemId="item1" onClose={() => {}} />)
    await waitFor(() => screen.getByText(/1小節4拍/))
    fireEvent.click(btn(/8分/))          // 長さ ♪
    fireEvent.click(btn(/3連/))          // ⅔倍
    fireEvent.click(btn(/^1 A4$/))       // 高さ ①
    for (let i = 0; i < 12; i++) clickAdd()
    expect(screen.getByText(/4拍ぴったり/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText(/例:/), { target: { value: "3連8分" } })
    const submit = btn(/この形で作成/) as HTMLButtonElement
    expect(submit.disabled).toBe(false)
    fireEvent.click(submit)
    await waitFor(() => expect(created.length).toBe(1))
    const input = created[0] as { notes: { base: string; triplet?: boolean }[] }
    expect(input.notes).toHaveLength(12)
    expect(input.notes.every((n) => n.base === "e" && n.triplet === true)).toBe(true)
  })

  it("3連4分×3 + 4分×2 も 4拍ぴったり", async () => {
    render(<RhythmVariantDialog itemId="item1" onClose={() => {}} />)
    await waitFor(() => screen.getByText(/1小節4拍/))
    fireEvent.click(btn(/4分/)); fireEvent.click(btn(/3連/)); fireEvent.click(btn(/^1 A4$/))
    for (let i = 0; i < 3; i++) clickAdd()
    fireEvent.click(btn(/3連/))          // 3連を外す
    for (let i = 0; i < 2; i++) clickAdd()
    expect(screen.getByText(/4拍ぴったり/)).toBeTruthy()
  })

  it("高さを2つ選ぶと重音として足せる", async () => {
    render(<RhythmVariantDialog itemId="item1" onClose={() => {}} />)
    await waitFor(() => screen.getByText(/1小節4拍/))
    fireEvent.click(btn(/全$/))          // 全音符 = 4拍 (ボタン文字は「𝅝全」)
    fireEvent.click(btn(/^1 A4$/)); fireEvent.click(btn(/^2 B4$/))
    expect(screen.getByText(/重音 ・ 1と2 を同時に鳴らす/)).toBeTruthy()
    clickAdd()
    expect(screen.getByText(/4拍ぴったり/)).toBeTruthy()
    expect(screen.getByText(/1\+2: A4・B4/)).toBeTruthy()
  })
})
