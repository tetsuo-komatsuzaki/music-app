// ゲートの文言 (要件整理 v2.7 §0「無料で登録」禁止・§3 ゲートの文言・UI 文言に括弧禁止)。2026-09-13 検証ループ
import { describe, expect, it } from "vitest"
import { GATE_TEXT } from "./gateText"

function allTexts(): string[] {
  const out: string[] = []
  const push = (g: { title: string; items: { title: string; detail: string }[] }) => {
    out.push(g.title); g.items.forEach((i) => { out.push(i.title); out.push(i.detail) })
  }
  push(GATE_TEXT.song("かっこう")); push(GATE_TEXT.songTry("かっこう")); push(GATE_TEXT.songUsed("かっこう", 95)); push(GATE_TEXT.songUsed("かっこう", null))
  push(GATE_TEXT.resume); push(GATE_TEXT.item("音階")); push(GATE_TEXT.lesson); push(GATE_TEXT.karte); push(GATE_TEXT.teacher); push(GATE_TEXT.upload); push(GATE_TEXT.contact); push(GATE_TEXT.generic)
  return out
}

describe("GATE_TEXT", () => {
  it("「無料で登録」「無料プラン」「1 日 8 本まで無料」を使わない", () => {
    for (const t of allTexts()) {
      expect(t).not.toMatch(/無料で登録|無料プラン|本まで無料|無料でためせ/)
    }
  })
  it("無料に触れるときは必ず条件つき一文の形", () => {
    for (const t of allTexts()) {
      if (t.includes("無料")) expect(t).toMatch(/最初の 2 週間は無料、その後 月 1,280 円/)
    }
  })
  it("括弧を使わない", () => {
    for (const t of allTexts()) expect(t).not.toMatch(/[()（）]/)
  })
  it("1 回ためし: 未使用は曲名入りの見出しと主ボタンの根拠、使用済みは点数入り", () => {
    expect(GATE_TEXT.songTry("かっこう").title).toBe("かっこうを、登録なしで 1 回だけ採点してみられます")
    expect(GATE_TEXT.songUsed("かっこう", 95).title).toBe("続けるには、はじめる手続きが必要です")
    expect(GATE_TEXT.songUsed("かっこう", 95).items[0].title).toBe("さっきの 95 点")
    expect(GATE_TEXT.songUsed("かっこう", null).items[0].title).toBe("かっこうの採点")
  })
  it("契約切れ: 再開する", () => {
    expect(GATE_TEXT.resume.title).toBe("アルコプラスが終了しています")
    expect(GATE_TEXT.resume.items.map((i) => i.title)).toContain("再開する")
  })
})
