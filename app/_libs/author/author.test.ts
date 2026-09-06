import { describe, it, expect } from "vitest"
import { emptyMeasure, newNote, newRest, durQl, measureQl, type AuthorScore, type Duration, type Pitch } from "./model"
import { accidentalsForMeasure, autoStringFinger, generateArpeggio, generateScale, keyAlter, pitchName, positionOf, spellMidi, stepInKey, pitchAt, parseShorthand, autoFingerAll, midiOf, tonicOf } from "./pitch"
import { buildMusicXml, DIVISIONS } from "./musicxml"
import { validateScore } from "./validate"

const q: Duration = { base: "q", dots: 0, tuplet: null }
const e8: Duration = { base: "e", dots: 0, tuplet: null }
const P = (step: Pitch["step"], alter: Pitch["alter"], octave: number): Pitch => ({ step, alter, octave })

function score(measures: AuthorScore["measures"], over: Partial<AuthorScore> = {}): AuthorScore {
  return { version: 1, title: "t", composer: "", category: "scale", time: { beats: 4, beatType: 4 }, key: { fifths: 1, mode: "major" }, tempoMin: null, tempoMax: null, articulation: null, measures, ...over }
}

describe("音価", () => {
  it("付点 ・ 複付点 ・ 連符", () => {
    expect(durQl({ base: "q", dots: 1, tuplet: null })).toBe(1.5)
    expect(durQl({ base: "q", dots: 2, tuplet: null })).toBe(1.75)
    expect(durQl({ base: "e", dots: 0, tuplet: { actual: 3, normal: 2 } })).toBeCloseTo(1 / 3)
    expect(durQl({ base: "x", dots: 0, tuplet: null })).toBe(0.0625)
    expect(measureQl({ beats: 6, beatType: 8 })).toBe(3)
  })
})

describe("ポジションの算術 (解析器と同じ)", () => {
  it("D 線の F5 は指 1 で第 9、指 4 で第 6 ・ 上限 12 の内", () => {
    expect(positionOf(P("F", 0, 5), "D", 1).pos).toBe(9)
    expect(positionOf(P("F", 0, 5), "D", 4).pos).toBe(6)
    expect(positionOf(P("F", 0, 5), "A", 2).pos).toBe(4)
  })
  it("開放弦より低い音 ・ 指 0 の誤用 ・ 手が下 は理由つきで弾く", () => {
    expect(positionOf(P("F", 0, 3), "G", 1).reason).toContain("開放弦より低い")
    expect(positionOf(P("A", 0, 4), "G", 0).reason).toContain("指 0")
    expect(positionOf(P("A", 0, 3), "G", 4).reason).toContain("手が開放弦より下")
  })
  it("ハーフポジション (G 線 G#3 指 1) は第 1", () => {
    expect(positionOf(P("G", 1, 3), "G", 1).pos).toBe(1)
  })
  it("自動付与は低い弦の第 1 ポジション優先 ・ 前の音と同じ弦を優先", () => {
    expect(autoStringFinger(P("B", 0, 3))).toEqual({ string: "G", finger: 2, pos: 1 })
    expect(autoStringFinger(P("D", 0, 4))).toMatchObject({ string: "D", finger: 0 })   // 開放弦を優先
    expect(autoStringFinger(P("E", 0, 4), { string: "D", pos: 1 })).toMatchObject({ string: "D", finger: 1 })
    expect(autoStringFinger(P("D", 0, 6))).toMatchObject({ string: "E" })
  })
  it("弦 ・ 指 ・ ポジション → 音 (調の綴り)", () => {
    expect(pitchName(pitchAt("A", 1, 1, { fifths: 1, mode: "major" })!)).toBe("B4")
    expect(pitchName(pitchAt("A", 1, 3, { fifths: 1, mode: "major" })!)).toBe("D5")
    expect(pitchName(pitchAt("D", 2, 1, { fifths: 1, mode: "major" })!)).toBe("F#4")
    expect(pitchName(pitchAt("D", 3, 1, { fifths: 1, mode: "major" })!)).toBe("G4")
  })
})

describe("調 ・ 綴り", () => {
  it("調号の変化 ・ 主音", () => {
    expect(keyAlter({ fifths: 2, mode: "major" }, "C")).toBe(1)
    expect(keyAlter({ fifths: -3, mode: "major" }, "A")).toBe(-1)
    expect(tonicOf({ fifths: -1, mode: "minor" })).toBe("D")
    expect(tonicOf({ fifths: 3, mode: "major" })).toBe("A")
  })
  it("調の音を 1 段上がる ・ 半音", () => {
    expect(pitchName(stepInKey(P("F", 1, 4), 1, { fifths: 2, mode: "major" }))).toBe("G4")
    expect(pitchName(stepInKey(P("B", 0, 4), 1, { fifths: 2, mode: "major" }))).toBe("C#5")
    expect(pitchName(spellMidi(61, "flat"))).toBe("Db4")
  })
})

describe("臨時記号の 6 規則", () => {
  const key = { fifths: 1, mode: "major" as const }   // G 長調 (F#)
  it("① 調号の音には付けない ② 違う音には付ける ③ 同じ小節の 2 回目は省く (オクターブ違いは付ける) ⑤ ナチュラルで戻す", () => {
    const els = [newNote(P("F", 1, 4), q), newNote(P("F", 0, 4), q), newNote(P("F", 0, 4), q), newNote(P("F", 0, 5), q)]
    const { out } = accidentalsForMeasure(key, els, new Map())
    expect(out.get(`${els[0].id}#0`)).toBeNull()
    expect(out.get(`${els[1].id}#0`)).toEqual({ kind: "natural", cautionary: false })
    expect(out.get(`${els[2].id}#0`)).toBeNull()
    expect(out.get(`${els[3].id}#0`)).toEqual({ kind: "natural", cautionary: false })
  })
  it("④ 小節をまたいだら付け直す ⑥ 前の小節で変えた音が戻るとき 親切な臨時記号", () => {
    const m1 = [newNote(P("F", 0, 4), q)]
    const r1 = accidentalsForMeasure(key, m1, new Map())
    const m2 = [newNote(P("F", 1, 4), q), newNote(P("F", 1, 4), q)]
    const r2 = accidentalsForMeasure(key, m2, r1.state)
    expect(r2.out.get(`${m2[0].id}#0`)).toEqual({ kind: "sharp", cautionary: true })
    expect(r2.out.get(`${m2[1].id}#0`)).toBeNull()
  })
  it("タイで続く音には付けない", () => {
    const a = newNote(P("B", -1, 4), q); a.tie = "start"
    const b = newNote(P("B", -1, 4), q); b.tie = "stop"
    const { out } = accidentalsForMeasure(key, [a, b], new Map())
    expect(out.get(`${a.id}#0`)).toEqual({ kind: "flat", cautionary: false })
    expect(out.get(`${b.id}#0`)).toBeNull()
  })
})

describe("並べる", () => {
  it("G 長調 2 オクターブ 上って下りる = 29 音 ・ 綴りは調どおり", () => {
    const s = generateScale({ key: { fifths: 1, mode: "major" }, kind: "major", octaves: 2, shape: "updown", dur: e8 })
    expect(s.length).toBe(29)
    expect(s.map((e) => pitchName(e.heads[0].pitch)).slice(0, 8)).toEqual(["G3", "A3", "B3", "C4", "D4", "E4", "F#4", "G4"])
  })
  it("旋律的短音階は上りと下りで音が違う", () => {
    const s = generateScale({ key: { fifths: 0, mode: "minor" }, kind: "melodic", octaves: 1, shape: "updown", dur: q })
    const names = s.map((e) => pitchName(e.heads[0].pitch))
    expect(names.slice(0, 8)).toEqual(["A3", "B3", "C4", "D4", "E4", "F#4", "G#4", "A4"])
    expect(names.slice(8)).toEqual(["G4", "F4", "E4", "D4", "C4", "B3", "A3"])
  })
  it("和声的短音階 ・ 属七 ・ 減七 の綴り", () => {
    const h = generateScale({ key: { fifths: -1, mode: "minor" }, kind: "harmonic", octaves: 1, shape: "up", dur: q })
    expect(h.map((e) => pitchName(e.heads[0].pitch))).toEqual(["D4", "E4", "F4", "G4", "A4", "Bb4", "C#5", "D5"])
    const a = generateArpeggio({ key: { fifths: 1, mode: "major" }, kind: "dominant7", octaves: 1, shape: "up", dur: q })
    expect(a.map((e) => pitchName(e.heads[0].pitch))).toEqual(["G3", "B3", "D4", "F4", "G4"])
  })
  it("弦と指の自動付与は G 線から始まり隣の弦へ", () => {
    const s = autoFingerAll(generateScale({ key: { fifths: 1, mode: "major" }, kind: "major", octaves: 1, shape: "up", dur: q }))
    expect(s.map((e) => `${e.heads[0].string}${e.heads[0].finger}`)).toEqual(["G0", "G1", "G2", "G3", "D0", "D1", "D2", "D3"])
  })
  it("型の文字列 ・ ポジション付き", () => {
    const els = parseShorthand("A1 A2 3p A1", q, { fifths: 1, mode: "major" })
    expect(els.map((e) => pitchName(e.heads[0].pitch))).toEqual(["B4", "C5", "D5"])
    expect(els[2].heads[0]).toMatchObject({ string: "A", finger: 1 })
  })
})

describe("MusicXML", () => {
  it("調 ・ 拍子 ・ 弦 ・ 指 ・ 臨時記号 ・ 小節番号 ・ 終止線", () => {
    const m = emptyMeasure({ elements: [newNote(P("G", 0, 3), q, { string: "G", finger: 0 }), newNote(P("F", 0, 4), q, { string: "D", finger: 2 }), newRest(q), newNote(P("A", 0, 4), q)] })
    const xml = buildMusicXml(score([m]))
    expect(xml).toContain("<fifths>1</fifths><mode>major</mode>")
    expect(xml).toContain("<beats>4</beats><beat-type>4</beat-type>")
    expect(xml).toContain("<string>4</string><fingering>0</fingering>")
    expect(xml).toContain("<accidental>natural</accidental>")
    expect(xml).toContain(`<duration>${DIVISIONS}</duration>`)
    expect(xml).toContain('<measure number="1">')
    expect(xml).toContain("<bar-style>light-heavy</bar-style>")
  })
  it("弱起 ・ 拍子と調の変更 ・ 反復 ・ 括弧 ・ とび先 ・ 強弱 ・ テンポ", () => {
    const m0 = emptyMeasure({ implicit: true, elements: [newNote(P("D", 0, 4), q)] })
    const m1 = emptyMeasure({ repeatStart: true, tempo: 80, elements: [newNote(P("G", 0, 4), { base: "w", dots: 0, tuplet: null })] })
    m1.elements[0].dyn = "mf"
    const m2 = emptyMeasure({ endingStart: 1, endingStop: 1, repeatEnd: true, elements: [newRest({ base: "w", dots: 0, tuplet: null })] })
    const m3 = emptyMeasure({ endingStart: 2, endingStop: 2, time: { beats: 3, beatType: 4 }, key: { fifths: -1, mode: "major" }, direction: "fine", elements: [newRest({ base: "h", dots: 1, tuplet: null })] })
    const xml = buildMusicXml(score([m0, m1, m2, m3]))
    expect(xml).toContain('<measure number="0" implicit="yes">')
    expect(xml).toContain('<repeat direction="forward"/>')
    expect(xml).toContain('<ending number="1" type="start"/>')
    expect(xml).toContain('<ending number="1" type="stop"/>')
    expect(xml).toContain('<repeat direction="backward"/>')
    expect(xml).toContain('<ending number="2" type="discontinue"/>')
    expect(xml).toContain("<beats>3</beats>")
    expect(xml).toContain("<fifths>-1</fifths>")
    expect(xml).toContain('<sound fine="yes"/>')
    expect(xml).toContain("<dynamics><mf/></dynamics>")
    expect(xml).toContain("<per-minute>80</per-minute>")
    expect(xml).toContain('<rest measure="yes"/>')
  })
  it("重音 ・ タイ ・ スラー ・ 連符 ・ 装飾音 ・ 奏法 ・ 弓 ・ ハーモニクス ・ トリル ・ トレモロ", () => {
    const chord = newNote(P("D", 0, 4), q, { string: "D", finger: 0 }); chord.heads.push({ pitch: P("A", 0, 4), string: "A", finger: 0 })
    const t1 = newNote(P("B", 0, 4), e8, { string: "A", finger: 1 }); t1.tie = "start"; t1.slurStart = [1]; t1.arts = ["staccato", "bow_staccato"]; t1.bow = "down"
    const t2 = newNote(P("B", 0, 4), e8); t2.tie = "stop"; t2.slurStop = [1]; t2.arts = ["martele", "portato", "legato", "tremolo"]; t2.orn = "trill"; t2.special = "harmonic"
    const trip = [0, 1, 2].map(() => newNote(P("C", 1, 5), { base: "e", dots: 0, tuplet: { actual: 3, normal: 2 } }))
    const g = newNote(P("D", 0, 5), { base: "s", dots: 0, tuplet: null }); g.grace = true
    const m = emptyMeasure({ elements: [chord, t1, t2, g, ...trip] })
    const xml = buildMusicXml(score([m]))
    expect(xml).toContain("<chord/>")
    expect(xml).toContain('<tie type="start"/>'); expect(xml).toContain('<tied type="stop"/>')
    expect(xml).toContain('<slur type="start" number="1"'); expect(xml).toContain('<slur type="stop" number="1"/>')
    expect(xml).toContain("<actual-notes>3</actual-notes><normal-notes>2</normal-notes>"); expect(xml).toContain('<tuplet type="start"'); expect(xml).toContain('<tuplet type="stop"/>')
    expect(xml).toContain('<grace slash="yes"/>')
    expect(xml).toContain("<staccato/>"); expect(xml).toContain("<strong-accent/>"); expect(xml).toContain("<detached-legato/>"); expect(xml).toContain("<tenuto/>")
    expect(xml).toContain("<down-bow/>"); expect(xml).toContain("<harmonic><natural/></harmonic>"); expect(xml).toContain("<trill-mark/>"); expect(xml).toContain('<tremolo type="single">2</tremolo>')
    // 3 連符 3 つ = 1 拍 = 960
    const durs = [...xml.matchAll(/<duration>(\d+)<\/duration>/g)].map((x) => Number(x[1]))
    expect(durs.filter((d) => d === 320).length).toBe(3)
  })
})

describe("検証", () => {
  it("拍の不足 ・ 余り ・ 弦指の不整合 ・ タイ ・ スラー ・ 括弧 ・ とび先", () => {
    const m1 = emptyMeasure({ elements: [newNote(P("G", 0, 3), q, { string: "D", finger: 1 }), newNote(P("A", 0, 3), q)] })
    m1.elements[0].tie = "start"
    m1.elements[1].slurStop = [2]
    const m2 = emptyMeasure({ endingStop: 1, direction: "dsAlFine", elements: [newRest({ base: "w", dots: 0, tuplet: null }), newRest(q)] })
    const p = validateScore(score([m1, m2]))
    const texts = p.map((x) => x.text).join(" | ")
    expect(texts).toContain("拍が足りません (2 / 4 拍)")
    expect(texts).toContain("拍が余っています (5 / 4 拍)")
    expect(texts).toContain("開放弦より低い")
    expect(texts).toContain("前の音のタイが終わっていません")
    expect(texts).toContain("スラー 2 の終わりだけ")
    expect(texts).toContain("1 番括弧の終わりに対応する始まりがありません")
    expect(texts).toContain("Segno がありません")
    expect(texts).toContain("Fine がありません")
  })
  it("正しい楽譜は問題なし", () => {
    const els = autoFingerAll(generateScale({ key: { fifths: 1, mode: "major" }, kind: "major", octaves: 1, shape: "up", dur: e8 }))
    const m = emptyMeasure({ elements: els })
    expect(validateScore(score([m])).filter((x) => x.level === "error")).toEqual([])
    expect(midiOf(els[0].heads[0].pitch)).toBe(55)
  })
})
