import { describe, it, expect } from "vitest"
import { extractScoreSymbols, type SymbolSourceAnalysis } from "./scoreSymbols"

const note = (i: number, over: Partial<SymbolSourceAnalysis["notes"][number]> = {}) => ({
  note_index: i, type: "note", articulations: [], ...over,
})

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

  it("休符には記号を付けない (休符はガイド対象外)", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [{ note_index: 0, type: "rest", articulations: ["Staccato"] }],
    })
    expect(list).toEqual([])
    expect(byNote.has(0)).toBe(false)
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

  it("フラグ系 (トリル/トレモロ) を拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { is_trill: true }), note(1, { is_tremolo: true })],
    })
    expect(new Set(list.map((s) => s.id))).toEqual(new Set(["trill", "tremolo"]))
  })

  it("強弱は値ごとに別の記号になる", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0, { dynamic: "f" }), note(1, { dynamic: "pp" })],
    })
    expect(list.find((s) => s.id === "dynamic:f")?.value).toBe("f")
    expect(list.find((s) => s.id === "dynamic:pp")?.what).toContain("とても小さく")
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
      notes: [note(0, { articulations: ["Staccato"] })],
      key: { tonic: "C", mode: "major" },
      spanners: { slurs: [{ start: 0, end: 0 }] },
    })
    // JSON の並び: slur → staccato → …(左手/装飾)… → (構造) → key_signature
    expect(list.map((s) => s.id)).toEqual(["slur", "staccato", "key_signature"])
  })

  it("expressions からフェルマータ・装飾を拾う", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [
        note(0, { expressions: ["Fermata"] }),
        note(1, { expressions: ["Turn"] }),
        note(2, { expressions: ["Turn:delayed"] }),
        note(3, { expressions: ["Schleifer"] }),
      ],
    })
    expect(new Set(list.map((s) => s.id)))
      .toEqual(new Set(["fermata", "turn", "delayed_turn", "schleifer"]))
    expect(byNote.get(3)).toEqual(["schleifer"])
  })

  it("臨時記号は種類ごとに、かっこつきは親切記号としても出す", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [
        note(0, { accidental: { name: "sharp", style: "normal" } }),
        note(1, { accidental: { name: "double-flat", style: "normal" } }),
        note(2, { accidental: { name: "flat", style: "parentheses" } }),
      ],
    })
    expect(list.find((s) => s.id === "accidental")?.noteIndices).toEqual([0])
    expect(list.find((s) => s.id === "double_accidental")?.noteIndices).toEqual([1])
    // かっこつきの♭は「臨時記号(normal)」には入らず、親切記号として出る
    expect(byNote.get(2)).toEqual(["cautionary_accidental"])
  })

  it("特殊な符頭を拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [
        note(0, { notehead: "diamond" }), note(1, { notehead: "x" }),
        note(2, { notehead: "normal" }),
      ],
    })
    expect(new Set(list.map((s) => s.id)))
      .toEqual(new Set(["notehead_diamond", "notehead_x"]))
  })

  it("グリッサンドは解析側のフラグから拾う", () => {
    const { list } = extractScoreSymbols({ notes: [note(0, { is_glissando: true }), note(1)] })
    expect(list.find((s) => s.id === "glissando")?.noteIndices).toEqual([0])
  })

  it("文字指示 (arco / rit. / con sordino) を音符に紐づけて拾う", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0), note(1), note(2), note(3)],
      directions: [
        { note_index: 1, texts: ["arco"] },
        { note_index: 2, texts: ["sul pont.", "con sordino"] },
        { note_index: 3, texts: ["rit."] },
      ],
    })
    expect(list.find((s) => s.id === "arco")?.noteIndices).toEqual([1])
    expect(byNote.get(2)).toEqual(["sul_ponticello", "con_sordino"])
    expect(list.find((s) => s.id === "tempo_change")?.value).toBe("rit.")
  })

  it("文字指示は表記ゆれ・大文字小文字を吸収する", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0), note(1)],
      directions: [{ note_index: 0, texts: ["Sul Pont."] }, { note_index: 1, texts: ["A Tempo"] }],
    })
    expect(new Set(list.map((s) => s.id))).toEqual(new Set(["sul_ponticello", "tempo_change"]))
  })

  it("曲全体の構造から 転調・拍子変更・反復を出す", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0)],
      structure: {
        key_signature_count: 2, time_signature_count: 3,
        has_repeat: true,
      },
    })
    const ids = new Set(list.map((s) => s.id))
    expect(ids.has("key_change")).toBe(true)
    expect(ids.has("time_change")).toBe(true)
    expect(ids.has("repeat_bar")).toBe(true)
    // 曲全体の記号なので特定の音符には紐づかない
    expect(byNote.size).toBe(0)
  })

  it("調号が1つだけなら転調とは言わない", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0)], structure: { key_signature_count: 1, time_signature_count: 1 },
    })
    expect(list.find((s) => s.id === "key_change")).toBeUndefined()
    expect(list.find((s) => s.id === "time_change")).toBeUndefined()
  })

  it("C / ¢ とテンポ表示を出す", () => {
    const c = extractScoreSymbols({ notes: [note(0)], structure: { time_symbol: "common" } })
    expect(c.list.find((s) => s.id === "time_symbol")?.value).toBe("C")
    const cut = extractScoreSymbols({ notes: [note(0)], structure: { time_symbol: "cut" } })
    expect(cut.list.find((s) => s.id === "time_symbol")?.value).toBe("¢")
    const t = extractScoreSymbols({
      notes: [note(0)],
      structure: { tempo_marks: [{ kind: "MetronomeMark", number: 90, text: "Allegro" }] },
    })
    expect(t.list.find((s) => s.id === "tempo_text")?.value).toBe("Allegro")
  })

  it("とび先の指示・装飾音を構造から拾う", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0)],
      structure: {
        navigation: ["Segno", "DaCapoAlFine"],
        grace_note_count: 2,
      },
    })
    // クラス名は譜面での書かれ方に直して見せる
    expect(list.find((s) => s.id === "navigation")?.value).toBe("セーニョ ・ D.C. al Fine")
    expect(new Set(list.map((s) => s.id)).has("grace_note")).toBe(true)
  })

  it("空の配列・0件では構造系の記号を出さない", () => {
    const { list } = extractScoreSymbols({
      notes: [note(0)],
      structure: { navigation: [], rehearsal_marks: [], grace_note_count: 0, beamed_note_count: 0 },
    })
    expect(list).toEqual([])
  })

  it("決まった語に当たらない文字指示は「ことばの指示」として拾う", () => {
    const { list, byNote } = extractScoreSymbols({
      notes: [note(0), note(1)],
      directions: [{ note_index: 0, texts: ["dolce"] }, { note_index: 1, texts: ["arco"] }],
    })
    expect(list.find((s) => s.id === "text_expression")?.value).toBe("dolce")
    // 特定キーワードに当たったものは受け皿に入れない
    expect(byNote.get(1)).toEqual(["arco"])
  })

  it("supply が pending の記号は (データが無いので) 出てこない", () => {
    const { list } = extractScoreSymbols({ notes: [note(0, { articulations: ["Staccato"] })] })
    expect(list.every((s) => s.supply === "ready")).toBe(true)
  })
})
