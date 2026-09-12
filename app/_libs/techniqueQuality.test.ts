import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow } from "./noteStore"
import { judgeNote, tallyQuality } from "./techniqueQuality"

const profile = (over: Partial<ProfileRow> = {}): ProfileRow => ({
  id: 1, noteCount: 1,
  pitch1: "G4", pitch2: "none", pitch3: "none", pitch4: "none",
  string1: "G", finger1: 0,
  noteType1: "quarter", dotted1: false, durationBeats1: 1, position: 1,
  techSlur: false, techPortato: false, techStaccato: false, techBowStaccato: false, techSpiccato: false,
  techRicochet: false, techPizzicato: false, techTremolo: false, techVibrato: false, techTrill: false,
  techMordent: false, techGlissando: false, techHarmonic: false,
  tupletActual: 0, tupletNormal: 0, onBeat: true, chordCont: false, restBefore: 0,
  ...over,
})

const note = (over: Partial<DetailRow> = {}, prof: Partial<ProfileRow> = {}): DetailRow => ({
  performanceId: "p1", noteIndex: 0, pitchOk: true, startOk: true, evaluationStatus: "ok",
  expectedStartSec: 0, cur: profile(prof), prev: null,
  ...over,
})

describe("judgeNote", () => {
  it("スタッカートは音価の半分以下で合格。境目の 0.5 は合格に含める", () => {
    expect(judgeNote("staccato", note({ durRatio: 0.3 }))).toBe(true)
    expect(judgeNote("staccato", note({ durRatio: 0.5 }))).toBe(true)
    expect(judgeNote("staccato", note({ durRatio: 0.51 }))).toBe(false)
  })

  it("ポルタートは切るが切りすぎない。両端は範囲に含める", () => {
    expect(judgeNote("portato", note({ durRatio: 0.49 }))).toBe(false)
    expect(judgeNote("portato", note({ durRatio: 0.5 }))).toBe(true)
    expect(judgeNote("portato", note({ durRatio: 0.85 }))).toBe(true)
    expect(judgeNote("portato", note({ durRatio: 0.86 }))).toBe(false)
  })

  it("トリルは幅が範囲外なら往復の回数を見るまでもなく不合格", () => {
    expect(judgeNote("trill", note({ pitchAltCount: 10, pitchAltSemitones: 0.5 }))).toBe(false)
    expect(judgeNote("trill", note({ pitchAltCount: 10, pitchAltSemitones: 4 }))).toBe(false)
    expect(judgeNote("trill", note({ pitchAltCount: 3, pitchAltSemitones: 1 }))).toBe(false)
    expect(judgeNote("trill", note({ pitchAltCount: 4, pitchAltSemitones: 1 }))).toBe(true)
  })

  it("ピチカートはアタックが前方かつ減衰していること。片方だけでは不合格", () => {
    expect(judgeNote("pizzicato", note({ attackPeakFrac: 0.2, decayRatio: 0.3 }))).toBe(true)
    expect(judgeNote("pizzicato", note({ attackPeakFrac: 0.2, decayRatio: 0.8 }))).toBe(false)
    expect(judgeNote("pizzicato", note({ attackPeakFrac: 0.7, decayRatio: 0.3 }))).toBe(false)
  })

  it("音価の1.5倍を超える長さは検出の失敗なので、不合格ではなく null", () => {
    // 実測で出た 2.34 は、隣の音を飲み込んだ区間で測った値だった
    expect(judgeNote("staccato", note({ durRatio: 2.34 }))).toBeNull()
    expect(judgeNote("staccato", note({ durRatio: 1.5 }))).toBe(false)   // 境目は判定する
    expect(judgeNote("portato", note({ durRatio: 1.51 }))).toBeNull()
  })

  it("測定値が無い音は「できなかった」ではなく null", () => {
    expect(judgeNote("staccato", note({}))).toBeNull()
    expect(judgeNote("trill", note({ pitchAltCount: 8 }))).toBeNull()
    expect(judgeNote("pizzicato", note({ attackPeakFrac: 0.2 }))).toBeNull()
  })
})

describe("tallyQuality", () => {
  it("その奏法の音だけを数える。他の奏法の音は無視する", () => {
    const rows = [
      note({ durRatio: 0.3 }, { techStaccato: true }),
      note({ durRatio: 0.9 }, { techStaccato: true }),
      note({ durRatio: 0.3 }, { techSlur: true }),   // スラーなので対象外
    ]
    expect(tallyQuality("staccato", rows)).toEqual({ judged: 2, ok: 1, unmeasured: 0, pct: 50 })
  })

  it("測れない音は分母に入れず unmeasured に寄せる", () => {
    const rows = [
      note({ durRatio: 0.3 }, { techStaccato: true }),
      note({}, { techStaccato: true }),              // 古い録音で測定値なし
      note({}, { techStaccato: true }),
    ]
    expect(tallyQuality("staccato", rows)).toEqual({ judged: 1, ok: 1, unmeasured: 2, pct: 100 })
  })

  it("判定できた音が1つも無ければ割合は出さない", () => {
    const rows = [note({}, { techStaccato: true })]
    expect(tallyQuality("staccato", rows)).toEqual({ judged: 0, ok: 0, unmeasured: 1, pct: null })
  })
})
