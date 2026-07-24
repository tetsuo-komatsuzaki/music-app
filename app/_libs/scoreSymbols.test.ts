import { describe, it, expect } from "vitest"
import { extractScoreSymbols, type SymbolSourceAnalysis } from "./scoreSymbols"

const note = (i: number, over: Partial<SymbolSourceAnalysis["notes"][number]> = {}) => ({
  note_index: i, type: "note", articulations: [], ...over,
})
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

describe("extractScoreSymbols", () => {
  it("解析データが無ければ空", () => {
    expect(extractScoreSymbols(null).list).toEqual([])
    expect(extractScoreSymbols({ notes: [] }).list).toEqual([])
  })

  it("articulation を記号に翻訳し、音符インデックスを集める", () => {
    const a: SymbolSourceAnalysis = {
      notes: [
        note(0, { articulations: ["Staccato"] }),
        note(1, { articulations: ["Staccato", "Accent"] }),
        note(2),
      ],
    }
    const { list, byNote } = extractScoreSymbols(a)
    const st = list.find((s) => s.id === "staccato")!
    expect(st.label).toBe("スタッカート")
    expect(st.lessonId).toBe("staccato")
    expect(st.noteIndices).toEqual([0, 1])
    expect(byNote.get(1)).toEqual(["staccato", "accent"])
    expect(byNote.has(2)).toBe(false)
  })

  it("休符には音符用の記号を付けない (休符そのものは記号として出す)", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [{ note_index: 0, type: "rest", articulations: ["Staccato"] }],
    })
    expect(list.map((s) => s.id)).toEqual(["rest"])
    expect(byNote.get(0)).toEqual(["rest"])
  })

  it("スラーは spanner の区間すべての音符に付く", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0), note(1), note(2), note(3)],
      spanners: { slurs: [{ start: 1, end: 3 }] },
    })
    expect(list.find((s) => s.id === "slur")!.noteIndices).toEqual([1, 2, 3])
    expect(byNote.get(0)).toBeUndefined()
    expect(byNote.get(2)).toEqual(["slur"])
  })

  it("フラグ系 (トリル/トレモロ/タイ/重音) を拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { is_trill: true, is_tied: true }), note(1, { is_tremolo: true, is_chord: true })],
    })
    expect(new Set(list.map((s) => s.id)))
      .toEqual(new Set(["trill", "tie", "tremolo", "double_stop"]))
  })

  it("強弱・連符は値ごとに別の記号になる", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { dynamic: "f" }), note(1, { dynamic: "pp" }), note(2, { tuplet_actual: 3 })],
    })
    expect(list.find((s) => s.id === "dynamic:f")?.value).toBe("f")
    expect(list.find((s) => s.id === "dynamic:pp")?.what).toContain("とても小さく")
    expect(list.find((s) => s.id === "tuplet:3")?.label).toBe("3連符")
  })

  it("調号・拍子は曲全体の記号で、byNote には入れない", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0)],
      key: { tonic: "G", mode: "major" },
      time_signature: { numerator: 3, denominator: 4 },
    })
    const k = list.find((s) => s.id === "key_signature")!
    expect(k.value).toBe("♯1つ")
    expect(k.what).toContain("ファ")
    const t = list.find((s) => s.id === "time_signature")!
    expect(t.value).toBe("3/4")
    expect(t.what).toContain("4分の3拍子")
    expect(byNote.size).toBe(0)
  })

  it("平行調は同じ調号になる (長短の断定をしない)", () => {
    // music21 は ト長調の音階を E minor と推定することがある。どちらでも
    // 「♯1つ・ファ」と説明されるので、調名の取り違えがユーザーに伝わらない。
    const g = extractScoreSymbols({ notes: [note(0)], key: { tonic: "G", mode: "major" } })
    const e = extractScoreSymbols({ notes: [note(0)], key: { tonic: "E", mode: "minor" } })
    expect(g.list[0].value).toBe("♯1つ")
    expect(e.list[0].value).toBe("♯1つ")
    expect(g.list[0].what).toBe(e.list[0].what)
  })

  it("♭系・調号なしを正しく説明する", () => {
    const bes = extractScoreSymbols({ notes: [note(0)], key: { tonic: "B-", mode: "major" } })
    expect(bes.list[0].value).toBe("♭2つ")
    expect(bes.list[0].what).toContain("シ・ミ")
    const c = extractScoreSymbols({ notes: [note(0)], key: { tonic: "C", mode: "major" } })
    expect(c.list[0].value).toBe("♯♭なし")
    expect(c.list[0].tip).toBeUndefined()
  })

  it("クレッシェンド/デクレッシェンドを区間から拾う", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0), note(1), note(2)],
      spanners: { hairpins: [{ type: "crescendo", start: 0, end: 1 }, { type: "diminuendo", start: 2, end: 2 }] },
    })
    expect(list.find((s) => s.id === "crescendo")?.noteIndices).toEqual([0, 1])
    expect(byNote.get(2)).toEqual(["diminuendo"])
  })

  it("重音は音程から度数を判定し、対応するレッスンにつなぐ", () => {
    const { list } = extractScoreSymbols({
      notes: [
        note(0, { is_chord: true, pitches: [hz(62), hz(71)] }), // 長6度 = 9半音
        note(1, { is_chord: true, pitches: [hz(62), hz(74)] }), // オクターブ
        note(2, { is_chord: true, pitches: [hz(62), hz(64)] }), // 長2度 = 判定外
      ],
    })
    expect(list.find((s) => s.id === "double_stop_6")?.label).toBe("重音 6度")
    expect(list.find((s) => s.id === "double_stop_8")?.lessonId).toBe("ds8")
    expect(list.find((s) => s.id === "double_stop")?.noteIndices).toEqual([2])
  })

  it("music21 の派生クラス名 (StringHarmonic / SnapPizzicato) も拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [
        note(0, { articulations: ["StringHarmonic"] }),
        note(1, { articulations: ["SnapPizzicato"] }),
        note(2, { articulations: ["StringIndication"] }),
      ],
    })
    expect(new Set(list.map((s) => s.label)))
      .toEqual(new Set(["ハーモニクス", "バルトーク・ピチカート", "弦の指定"]))
    // StringHarmonic は Harmonic と同じ定義に寄せるので id が重複しない
    expect(list.find((s) => s.label === "ハーモニクス")!.id).toBe("harmonic")
  })

  it("StringHarmonic と Harmonic が混在してもチップは1つ", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { articulations: ["StringHarmonic"] }), note(1, { articulations: ["Harmonic"] })],
    })
    expect(list).toHaveLength(1)
    expect(list[0].noteIndices).toEqual([0, 1])
  })

  it("articulation が無く is_harmonic だけでもハーモニクスを出す", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { is_harmonic: true }), note(1, { articulations: ["Harmonic"], is_harmonic: true })],
    })
    const h = list.filter((s) => s.id === "harmonic")
    expect(h).toHaveLength(1)
    expect(h[0].noteIndices).toEqual([0, 1])
  })

  it("運指・弦は解析側の表示値からも拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { display_finger: 2 }), note(1, { display_string_num: 3 })],
    })
    expect(new Set(list.map((s) => s.id))).toEqual(new Set(["fingering", "string_indication"]))
  })

  it("未知の articulation は無視する", () => {
    const { list } = extractScoreSymbols({ notes: [note(0, { articulations: ["Unknown_XYZ"] })] })
    expect(list).toEqual([])
  })

  it("並び順は正本 (JSON) の宣言順にそろう", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { articulations: ["Staccato"], is_tied: true })],
      key: { tonic: "C", mode: "major" },
      spanners: { slurs: [{ start: 0, end: 0 }] },
    })
    // JSON の並び: slur → staccato → …(左手/装飾/強弱)… → tie → …(構造) → key_signature
    expect(list.map((s) => s.id)).toEqual(["slur", "staccato", "tie", "key_signature"])
  })

  it("expressions からフェルマータ・装飾を拾う", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [
        note(0, { expressions: ["Fermata"] }),
        note(1, { expressions: ["Turn"] }),
        note(2, { expressions: ["Turn:delayed"] }),
        note(3, { expressions: ["ArpeggioMark", "Schleifer"] }),
      ],
    })
    expect(new Set(list.map((s) => s.id)))
      .toEqual(new Set(["fermata", "turn", "delayed_turn", "arpeggio_mark", "schleifer"]))
    expect(byNote.get(3)).toEqual(["arpeggio_mark", "schleifer"])
  })

  it("臨時記号は種類ごとに、かっこつきは親切記号としても出す", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [
        note(0, { accidental: { name: "sharp", style: "normal" } }),
        note(1, { accidental: { name: "double-flat", style: "normal" } }),
        note(2, { accidental: { name: "half-sharp", style: "normal" } }),
        note(3, { accidental: { name: "flat", style: "parentheses" } }),
      ],
    })
    expect(list.find((s) => s.id === "accidental")?.noteIndices).toEqual([0])
    expect(list.find((s) => s.id === "double_accidental")?.noteIndices).toEqual([1])
    expect(list.find((s) => s.id === "quarter_tone")?.noteIndices).toEqual([2])
    // かっこつきの♭は「臨時記号(normal)」には入らず、親切記号として出る
    expect(byNote.get(3)).toEqual(["cautionary_accidental"])
  })

  it("付点は数で出し分け、特殊な符頭も拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [
        note(0, { dots: 1 }), note(1, { dots: 2 }),
        note(2, { notehead: "diamond" }), note(3, { notehead: "x" }),
        note(4, { notehead: "normal" }),
      ],
    })
    expect(new Set(list.map((s) => s.id)))
      .toEqual(new Set(["dotted", "double_dotted", "notehead_diamond", "notehead_x"]))
  })

  it("声部は2つ以上あるときだけ出す", () => {
    const single = extractScoreSymbols({ notes: [note(0, { voice: "1" }), note(1, { voice: "1" })] })
    expect(single.list.find((s) => s.id === "voice")).toBeUndefined()
    const multi = extractScoreSymbols({ notes: [note(0, { voice: "1" }), note(1, { voice: "2" })] })
    expect(multi.list.find((s) => s.id === "voice")?.noteIndices).toEqual([1])
  })

  it("グリッサンドは解析側のフラグから拾う", () => {
    const { list } = extractScoreSymbols({ notes: [note(0, { is_glissando: true }), note(1)] })
    expect(list.find((s) => s.id === "glissando")?.noteIndices).toEqual([0])
  })

  it("supply が pending の記号は (データが無いので) 出てこない", () => {
    const { list } = extractScoreSymbols({ notes: [note(0, { articulations: ["Staccato"] })] })
    expect(list.every((s) => s.supply === "ready")).toBe(true)
  })
})
