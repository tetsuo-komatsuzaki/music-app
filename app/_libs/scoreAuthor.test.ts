import { describe, it, expect } from "vitest"
import { autoStringFinger, buildMusicXml, generateSequence, parseShorthand, refitToString, stepInKey, totalBeats, fifthsOf, noteName } from "./scoreAuthor"
import { detectKeyFromMusicXmlText } from "./musicxmlKey"

describe("弦と指の自動付与", () => {
  it("第 1 ポジションで届く弦を低い方から", () => {
    expect(autoStringFinger(55)).toEqual({ str: "G", fin: 0, pos: 1 })   // G3 開放
    expect(autoStringFinger(59)).toEqual({ str: "G", fin: 2, pos: 1 })   // B3
    expect(autoStringFinger(62)).toEqual({ str: "G", fin: 4, pos: 1 })   // D4 = G 弦 4 指 (低い弦を優先)
    expect(autoStringFinger(71)).toEqual({ str: "A", fin: 1, pos: 1 })   // B4
  })
  it("届かない高さは E 弦で高いポジション", () => {
    const r = autoStringFinger(86)   // D6
    expect(r.str).toBe("E"); expect(r.pos).toBeGreaterThan(1)
  })
  it("弦を変えると同じ高さを取る指に", () => {
    expect(refitToString(62, "D")).toEqual({ str: "D", fin: 0, pos: 1 })
    expect(refitToString(55, "D")).toBeNull()   // G3 は D 弦では取れない
  })
})

describe("並べる", () => {
  it("G 長調 2 オクターブ 上って下りる = 29 音", () => {
    const seq = generateSequence({ tonic: "G", mode: "major", octaves: 2, shape: "updown", ql: 0.5 })
    expect(seq.length).toBe(29)
    expect(seq[0].midi).toBe(55); expect(seq[14].midi).toBe(79); expect(seq[28].midi).toBe(55)
    expect(totalBeats(seq)).toBe(14.5)
  })
  it("型の文字列 (ポジション付き) を音にする", () => {
    const n = parseShorthand("A1 3p A1", 1)
    expect(n[0]).toMatchObject({ str: "A", fin: 1, pos: 1, midi: 71 })
    expect(n[1]).toMatchObject({ str: "A", fin: 1, pos: 3, midi: 75 })
  })
  it("五線譜の段は調の隣の音", () => {
    expect(stepInKey(67, 1, "G", "major")).toBe(69)   // G4 → A4
    expect(stepInKey(69, 1, "G", "major")).toBe(71)   // A4 → B4
    expect(stepInKey(71, 1, "G", "major")).toBe(72)   // B4 → C5
    expect(stepInKey(55, -1, "G", "major")).toBe(55)  // 音域の下には出ない
  })
})

describe("MusicXML", () => {
  it("調号 ・ 弦 ・ 指 ・ 小節割りが入る", () => {
    const seq = generateSequence({ tonic: "G", mode: "major", octaves: 1, shape: "up", ql: 0.5 })   // 8 音 = 4 拍
    const xml = buildMusicXml({ title: "G 長調 音階", tonic: "G", keyMode: "major", beats: 4, notes: seq })
    expect(xml).toContain("<fifths>1</fifths>")
    expect(xml).toContain("<string>4</string><fingering>0</fingering>")   // G3 開放
    expect((xml.match(/<measure /g) ?? []).length).toBe(1)
    expect(detectKeyFromMusicXmlText(xml)).toMatchObject({ keyTonic: "G", keyMode: "major" })
  })
  it("小節をまたぐ音はタイで割る", () => {
    const notes = [1, 1, 1, 2].map((ql) => ({ midi: 69, str: "A" as const, fin: 0, pos: 1, ql, art: "" as const }))
    const xml = buildMusicXml({ title: "t", tonic: "C", keyMode: "major", beats: 4, notes })
    expect((xml.match(/<measure /g) ?? []).length).toBe(2)
    expect(xml).toContain('<tie type="start"/>'); expect(xml).toContain('<tie type="stop"/>')
  })
  it("短調は平行長調の調号 ・ フラット系の綴り", () => {
    expect(fifthsOf("D", "minor")).toBe(-1)
    expect(noteName(70, true)).toBe("Bb4")
    expect(fifthsOf("E", "minor")).toBe(1)
  })
})
