/**
 * personalReco.test.ts — ホームのおすすめエンジン (2026-09-05 ノート属性ストア版)。
 *
 * 検査するのは規則そのもの (仕様 §5)。DB は差し替え (NoteStoreSource) で、明細と教材の並びを
 * メモリ上に作って流す。参照実装 music-analyzer/_tmp_proto/test_patterns.py の100パターンのうち、
 * 読み手に関わるものをこちらに写している。
 */
import { describe, it, expect } from "vitest"
import {
  aggregate, pickWeakest, groupKeysOf, parseKey, FAST_SWITCH_SEC,
  type DetailRow, type ProfileRow, type NoteStoreSource, type GroupKey, type Unit,
} from "./noteStore"
import { buildPersonalReco, focusName, MIN_TARGET, TAB_CATEGORIES } from "./personalReco"

// ───────── 部品 ─────────
let nextId = 1
function P(pitch: string, o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: nextId++, noteCount: 1, pitch1: pitch, pitch2: "none", pitch3: "none", pitch4: "none",
    string1: "D", finger1: 1, noteType1: "quarter", dotted1: false, durationBeats1: 1,
    position: 1,
    techSlur: false, techPortato: false, techStaccato: false, techBowStaccato: false, techSpiccato: false,
    techRicochet: false, techPizzicato: false, techTremolo: false, techVibrato: false, techTrill: false,
    techMordent: false, techGlissando: false, techHarmonic: false,
    tupletActual: 0, tupletNormal: 0, onBeat: true, chordCont: false, restBefore: 0,
    ...o,
  }
}
/** 演奏1回ぶんの明細。profiles を順に鳴らし、miss の番号の音程を外す */
function perf(id: string, profiles: ProfileRow[], miss: number[] = [], opts: { gap?: number; timingMiss?: number[]; undetected?: number[] } = {}): DetailRow[] {
  const gap = opts.gap ?? 1.0
  return profiles.map((p, i) => ({
    performanceId: id, noteIndex: i,
    pitchOk: !miss.includes(i), startOk: !(opts.timingMiss ?? []).includes(i),
    evaluationStatus: (opts.undetected ?? []).includes(i) ? "not_detected" : miss.includes(i) ? "pitch_miss" : "ok",
    expectedStartSec: i * gap, cur: p, prev: i > 0 ? profiles[i - 1] : null,
  }))
}
const E4 = P("E4"), Fs4 = P("F#4", { finger1: 2 }), Gs4 = P("G#4", { finger1: 3 }), A4 = P("A4", { finger1: 0, string1: "A" })
const B4 = P("B4", { string1: "A" }), Cs5 = P("C#5", { string1: "A", finger1: 2 })
const SCALE = [E4, Fs4, Gs4, A4, B4, Cs5]

function repeatPerfs(n: number, profiles: ProfileRow[], miss: number[] = [], prefix = "p"): DetailRow[] {
  const out: DetailRow[] = []
  for (let i = 0; i < n; i++) out.push(...perf(`${prefix}${i}`, profiles, miss))
  return out
}

/** メモリ上の教材棚。key → [{itemId, count, category, star}] */
type Shelf = { itemId: string; count: number; category: string; star: number }
function fakeSource(rows: DetailRow[], shelves: Record<GroupKey, Shelf[]> = {}): NoteStoreSource & { calls: Unit[] } {
  const calls: Unit[] = []
  return {
    calls,
    async fetchDetail(unit) { calls.push(unit); return rows },
    async findMaterial(key, star, cats) {
      const hits = (shelves[key] ?? []).filter((s) => cats.includes(s.category) && s.star <= star).sort((a, b) => b.count - a.count || a.itemId.localeCompare(b.itemId))
      return hits[0] ? { itemId: hits[0].itemId, count: hits[0].count } : null
    },
  }
}
const deps = (src: NoteStoreSource, star = 3) => ({
  source: src,
  userStar: async () => star,
  materialOf: async (id: string) => ({ id, title: `教材${id}`, category: "scale", star: 1, keyTonic: "E", keyMode: "major" }),
})

// ═════════ 束ね方 ═════════
describe("束ね方 ・ groupKeysOf / aggregate", () => {
  it("音程タブは 前の音名→今の音名。曲頭は入らない", () => {
    const agg = aggregate("pitch", perf("p", SCALE, [1]))
    expect([...agg.keys()]).toEqual(["pitch|E4|F#4", "pitch|F#4|G#4", "pitch|G#4|A4", "pitch|A4|B4", "pitch|B4|C#5"])
    expect(agg.get("pitch|E4|F#4")).toEqual({ target: 1, miss: 1 })
  })
  it("ミスはその音への移動に帰属する ・ R3", () => {
    const agg = aggregate("pitch", perf("p", SCALE, [4])) // 5番目 B4 を外す → A4→B4 のミス
    expect(agg.get("pitch|A4|B4")).toEqual({ target: 1, miss: 1 })
    expect(agg.get("pitch|B4|C#5")).toEqual({ target: 1, miss: 0 })
  })
  it("検出できない音は音程と入りの両方のミス", () => {
    const rows = perf("p", SCALE, [], { undetected: [2] })
    expect(aggregate("pitch", rows).get("pitch|F#4|G#4")).toEqual({ target: 1, miss: 1 })
    expect(aggregate("pitch", rows, "timing").get("pitch|F#4|G#4")).toEqual({ target: 1, miss: 1 })
  })
  it("入りのミスは音程の束に影響しない", () => {
    const rows = perf("p", SCALE, [], { timingMiss: [1] })
    expect(aggregate("pitch", rows).get("pitch|E4|F#4")).toEqual({ target: 1, miss: 0 })
    expect(aggregate("pitch", rows, "timing").get("pitch|E4|F#4")).toEqual({ target: 1, miss: 1 })
  })
  it("音名が不明の音は音程の束に入らない", () => {
    const rows = perf("p", [E4, P("unknown"), Gs4])
    expect([...aggregate("pitch", rows).keys()]).toEqual([])
  })
  it("わざタブは奏法ごと。奏法の無い音は入らない。2つ付けば両方に数える", () => {
    const s = P("E4", { techSlur: true }), ss = P("F#4", { techSlur: true, techStaccato: true })
    const agg = aggregate("technique", perf("p", [E4, s, ss], [2]))
    expect(agg.get("technique|slur")).toEqual({ target: 2, miss: 1 })
    expect(agg.get("technique|staccato")).toEqual({ target: 1, miss: 1 })
    expect(agg.has("technique|tremolo")).toBe(false)
  })
  it("ポジション移動タブは移動した音だけ。同じポジションと不明は入らない", () => {
    const rows = perf("p", [P("E4", { position: 1 }), P("B4", { position: 3 }), P("E5", { position: 3 }), P("A4", { position: -1 }), P("E4", { position: 1 })])
    expect([...aggregate("position", rows).keys()]).toEqual(["position|1|3"])
  })
  it("フィンガリングは 0.3秒未満・指を押さえる・音名が変わる 移動だけ", () => {
    const fast = perf("p", [Fs4, Gs4, Cs5], [1], { gap: 0.125 })
    expect(aggregate("fingering", fast).get("fingering|F#4|G#4")).toEqual({ target: 1, miss: 1 })
    const slow = perf("q", [Fs4, Gs4], [1], { gap: 1.0 })
    expect(aggregate("fingering", slow).size).toBe(0)
    const open = perf("r", [A4, B4], [1], { gap: 0.125 }) // A4 は開放弦
    expect(aggregate("fingering", open).size).toBe(0)
    const same = perf("s", [Fs4, P("F#4", { finger1: 2 })], [1], { gap: 0.125 })
    expect(aggregate("fingering", same).size).toBe(0)
  })
  it("フィンガリングの実時間は同じ演奏の中だけで測る ・ 演奏をまたがない", () => {
    const rows = [...perf("a", [Fs4], [], { gap: 0.1 }), ...perf("b", [Gs4], [], { gap: 0.1 })]
    // b の Gs4 は prev=null なので束に入らない。a の末尾との差は使われない
    expect(aggregate("fingering", rows).size).toBe(0)
    expect(groupKeysOf("fingering", rows[1], 0.05)).toEqual([])
  })
  it("繰り返しの曲 ・ 2回目のミスも同じ移動に足され、境目の移動も束になる", () => {
    const rep = [E4, Fs4, Gs4]
    const profiles = [...rep, ...rep.map((p) => ({ ...p }))]
    const rows = perf("p", profiles, [4]) // 2回目の F#4 を外す
    const agg = aggregate("pitch", rows)
    expect(agg.get("pitch|E4|F#4")).toEqual({ target: 2, miss: 1 })
    expect(agg.get("pitch|G#4|E4")).toEqual({ target: 1, miss: 0 })
  })
})

// ═════════ 選び方 ═════════
describe("選び方 ・ pickWeakest", () => {
  it("足切り未満は候補なし", () => {
    const agg = aggregate("pitch", repeatPerfs(9, SCALE, [1]))
    expect(pickWeakest(agg, 10).status).toBe("候補なし")
  })
  it("10音でちょうど候補になる", () => {
    const r = pickWeakest(aggregate("pitch", repeatPerfs(10, SCALE, [1])), 10)
    expect(r.status).toBe("ok"); expect(r.weakest?.key).toBe("pitch|E4|F#4"); expect(r.weakest?.target).toBe(10)
  })
  it("全部100%なら弱点なし", () => {
    const r = pickWeakest(aggregate("pitch", repeatPerfs(10, SCALE)), 10)
    expect(r.status).toBe("弱点なし"); expect(r.weakest).toBeNull(); expect(r.bestPct).toBe(100)
  })
  it("1つでも100%未満があればそれが出る", () => {
    const rows = [...repeatPerfs(9, SCALE), ...perf("z", SCALE, [4])]
    const r = pickWeakest(aggregate("pitch", rows), 10)
    expect(r.weakest?.key).toBe("pitch|A4|B4"); expect(r.weakest?.successPct).toBe(90)
  })
  it("いちばん低いものを選ぶ。同率は弾いた回数の多い方", () => {
    const agg = new Map([
      ["pitch|A|B", { target: 20, miss: 10 }],
      ["pitch|C|D", { target: 10, miss: 5 }],
      ["pitch|E|F", { target: 12, miss: 3 }],
    ])
    expect(pickWeakest(agg, 10).weakest?.key).toBe("pitch|A|B")
  })
  it("丸め ・ 10回中3ミスは70%", () => {
    const rows = [...repeatPerfs(3, SCALE, [1]), ...repeatPerfs(7, SCALE, [], "q")]
    expect(pickWeakest(aggregate("pitch", rows), 10).weakest?.successPct).toBe(70)
  })
  it("足切りは読み手ごと ・ 演奏1回でも 3音の足切りなら診断できる", () => {
    const rows = perf("p", [E4, Fs4, E4, Fs4, E4, Fs4, E4, Fs4], [1, 3, 5])
    expect(pickWeakest(aggregate("pitch", rows), 10).status).toBe("候補なし")
    const r = pickWeakest(aggregate("pitch", rows), 3)
    expect(r.weakest?.key).toBe("pitch|E4|F#4"); expect(r.weakest?.target).toBe(4)
  })
  it("キーの分解", () => {
    expect(parseKey("pitch|G4|C5")).toEqual({ tab: "pitch", a: "G4", b: "C5" })
    expect(parseKey("technique|slur")).toEqual({ tab: "technique", a: "slur", b: "" })
  })
})

// ═════════ 見出し ═════════
describe("見出し ・ focusName", () => {
  it("音程はカナで、♯♭を付け、オクターブは同名の移動だけ", () => {
    expect(focusName("pitch|G4|C5")).toBe("ソ→ド の移動")
    expect(focusName("pitch|F#4|Bb4")).toBe("ファ♯→シ♭ の移動")
    expect(focusName("pitch|G4|G5")).toBe("ソ→高いソ の移動")
    expect(focusName("pitch|G5|G4")).toBe("ソ→低いソ の移動")
  })
  it("ポジション・わざ・フィンガリング", () => {
    expect(focusName("position|1|3")).toBe("左手を第1から第3ポジションへ移す")
    expect(focusName("position|5|1")).toBe("左手を第5以上から第1ポジションへ移す")
    expect(focusName("technique|slur")).toBe("スラーのところ")
    expect(focusName("fingering|G4|A4")).toBe("ソ→ラ の速い切り替え")
  })
})

// ═════════ ホーム全体 ═════════
describe("buildPersonalReco", () => {
  it("明細が無いユーザーは枠ごと非表示", async () => {
    expect(await buildPersonalReco("u", deps(fakeSource([])))).toBeNull()
  })
  it("全タブ候補なしなら枠ごと非表示", async () => {
    expect(await buildPersonalReco("u", deps(fakeSource(perf("p", SCALE, [1]))))).toBeNull()
  })
  it("単位は累計 ・ ユーザーだけで絞る", async () => {
    const src = fakeSource(repeatPerfs(10, SCALE, [1]))
    await buildPersonalReco("u", deps(src))
    expect(src.calls).toEqual([{ userId: "u" }])
  })
  it("音程タブに束と教材が付く ・ 棚と★で絞られる", async () => {
    const shelves = {
      "pitch|E4|F#4": [
        { itemId: "etude", count: 99, category: "etude", star: 3 },   // 音程タブの棚ではない
        { itemId: "scaleHi", count: 30, category: "scale", star: 5 }, // ★が上
        { itemId: "scaleLo", count: 8, category: "scale", star: 1 },
      ],
    }
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE, [1]), shelves), 3))
    const pitch = reco!.tabs.find((t) => t.key === "pitch")!
    expect(pitch.focus).toEqual({ name: "ミ→ファ♯ の移動", successPct: 0 })
    expect(pitch.materials.map((m) => m.id)).toEqual(["scaleLo"])
    expect(TAB_CATEGORIES.pitch).toEqual(["scale", "arpeggio", "double_stop"])
  })
  it("在庫に無ければ教材なしで課題だけ出る", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE, [1]))))
    const pitch = reco!.tabs.find((t) => t.key === "pitch")!
    expect(pitch.focus?.name).toBe("ミ→ファ♯ の移動"); expect(pitch.materials).toEqual([])
  })
  it("弱点なしのタブは focus null ・ 100%を弱点と呼ばない ・ 枠は出る", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE))))
    expect(reco).not.toBeNull()
    expect(reco!.tabs.find((t) => t.key === "pitch")!.focus).toBeNull()
  })
  it("わざタブに奏法の束が立つ", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, [P("E4", { techSlur: true }), P("F#4", { techSlur: true })], [1], "s"))))
    expect(reco!.tabs.find((t) => t.key === "technique")!.focus?.name).toBe("スラーのところ")
  })
  it("全部低いタブは basics=true", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE, [1, 2, 3, 4, 5]))))
    expect(reco!.tabs.find((t) => t.key === "pitch")!.basics).toBe(true)
  })
  it("一部だけ低いタブは basics=false", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE, [1]))))
    expect(reco!.tabs.find((t) => t.key === "pitch")!.basics).toBe(false)
  })
  it("読みに失敗しても落ちない ・ null", async () => {
    const src: NoteStoreSource = { fetchDetail: async () => { throw new Error("no table") }, findMaterial: async () => null }
    expect(await buildPersonalReco("u", deps(src))).toBeNull()
  })
  it("4タブが順に並ぶ", async () => {
    const reco = await buildPersonalReco("u", deps(fakeSource(repeatPerfs(10, SCALE, [1]))))
    expect(reco!.tabs.map((t) => t.key)).toEqual(["pitch", "position", "technique", "fingering"])
  })
  it("足切りはホームの値 10音", () => {
    expect(MIN_TARGET).toBe(10)
    expect(FAST_SWITCH_SEC).toBe(0.3)
  })
})
