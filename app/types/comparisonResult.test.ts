import { describe, it, expect } from "vitest"
import {
  isEvaluated,
  pitchScore,
  EVALUATED_STATUSES,
  type EvaluationStatus,
} from "./comparisonResult"

// =========================================================
// 全 EvaluationStatus の網羅表
// INTENDED (comparisonResult.ts のドキュメントコメント + v1.7 Phase F 思想):
//   - 集計対象 (isEvaluated=true): evaluated / pitch_only / double_stop_* /
//     harmonic_ok / harmonic_normal_tone / harmonic_miss
//   - 判定保留 (isEvaluated=false): not_evaluated / not_detected /
//     section_missing / spectral_inconclusive
//   - △ (double_stop_partial / harmonic_normal_tone) は pitchScore=0.5
// =========================================================

const ALL_STATUSES: EvaluationStatus[] = [
  "evaluated",
  "pitch_only",
  "not_evaluated",
  "not_detected",
  "section_missing",
  "double_stop_full",
  "double_stop_partial",
  "double_stop_miss",
  "harmonic_ok",
  "harmonic_normal_tone",
  "harmonic_miss",
  "spectral_inconclusive",
]

// isEvaluated が true を返すべき status (集計対象)
const EVALUATED_TRUE = new Set<EvaluationStatus>([
  "evaluated",
  "pitch_only",
  "double_stop_full",
  "double_stop_partial",
  "double_stop_miss",
  "harmonic_ok",
  "harmonic_normal_tone",
  "harmonic_miss",
])

describe("EVALUATED_STATUSES (定数の中身)", () => {
  it("集計対象に含めるべき 8 status を過不足なく列挙している", () => {
    expect([...EVALUATED_STATUSES].sort()).toEqual(
      [...EVALUATED_TRUE].sort()
    )
  })

  it("判定保留系 (not_*/section_missing/spectral_inconclusive) を含まない", () => {
    const held: EvaluationStatus[] = [
      "not_evaluated",
      "not_detected",
      "section_missing",
      "spectral_inconclusive",
    ]
    for (const s of held) {
      expect(EVALUATED_STATUSES as readonly string[]).not.toContain(s)
    }
  })

  it("重音3種 + ハーモニクス3種を集計対象に含む (v1.7 Phase D/E 思想)", () => {
    const newStatuses: EvaluationStatus[] = [
      "double_stop_full",
      "double_stop_partial",
      "double_stop_miss",
      "harmonic_ok",
      "harmonic_normal_tone",
      "harmonic_miss",
    ]
    for (const s of newStatuses) {
      expect(EVALUATED_STATUSES as readonly string[]).toContain(s)
    }
  })
})

describe("isEvaluated: 全 EvaluationStatus を網羅", () => {
  for (const status of ALL_STATUSES) {
    const expected = EVALUATED_TRUE.has(status)
    it(`"${status}" -> ${expected}`, () => {
      expect(isEvaluated({ evaluation_status: status })).toBe(expected)
    })
  }

  it("網羅表は全 12 status をカバーしている (漏れ検知)", () => {
    expect(new Set(ALL_STATUSES).size).toBe(12)
  })
})

describe("isEvaluated: 欠損・不正値の扱い", () => {
  it("undefined -> false", () => {
    expect(isEvaluated({ evaluation_status: undefined })).toBe(false)
  })
  it("null -> false", () => {
    expect(isEvaluated({ evaluation_status: null })).toBe(false)
  })
  it("空文字 -> false (falsy 早期 return)", () => {
    expect(isEvaluated({ evaluation_status: "" })).toBe(false)
  })
  it("キー自体が無い -> false", () => {
    expect(isEvaluated({})).toBe(false)
  })
  it("未知の文字列 -> false", () => {
    expect(isEvaluated({ evaluation_status: "garbage_status" })).toBe(false)
  })
  it("大文字違い -> false (完全一致のみ)", () => {
    expect(isEvaluated({ evaluation_status: "Evaluated" })).toBe(false)
  })
})

describe("pitchScore: △ (partial/normal_tone) は pitch_ok に関わらず 0.5", () => {
  it("double_stop_partial + pitch_ok=null -> 0.5 (集約規則: 部分一致は pitch_ok=null)", () => {
    expect(
      pitchScore({ evaluation_status: "double_stop_partial", pitch_ok: null })
    ).toBe(0.5)
  })
  it("double_stop_partial + pitch_ok=true -> 0.5 (partial が優先)", () => {
    expect(
      pitchScore({ evaluation_status: "double_stop_partial", pitch_ok: true })
    ).toBe(0.5)
  })
  it("double_stop_partial + pitch_ok=false -> 0.5 (partial が優先)", () => {
    expect(
      pitchScore({ evaluation_status: "double_stop_partial", pitch_ok: false })
    ).toBe(0.5)
  })
  it("harmonic_normal_tone + pitch_ok=null -> 0.5 (音程合うが普通の音色)", () => {
    expect(
      pitchScore({ evaluation_status: "harmonic_normal_tone", pitch_ok: null })
    ).toBe(0.5)
  })
  it("harmonic_normal_tone + pitch_ok=false -> 0.5", () => {
    expect(
      pitchScore({ evaluation_status: "harmonic_normal_tone", pitch_ok: false })
    ).toBe(0.5)
  })
})

describe("pitchScore: △ 以外は pitch_ok===true で 1.0, それ以外 0.0", () => {
  // △でない全 status について pitch_ok の 3 値を総当り
  const nonPartial = ALL_STATUSES.filter(
    (s) => s !== "double_stop_partial" && s !== "harmonic_normal_tone"
  )

  for (const status of nonPartial) {
    it(`"${status}" + pitch_ok=true -> 1.0`, () => {
      expect(pitchScore({ evaluation_status: status, pitch_ok: true })).toBe(1.0)
    })
    it(`"${status}" + pitch_ok=false -> 0.0`, () => {
      expect(pitchScore({ evaluation_status: status, pitch_ok: false })).toBe(0.0)
    })
    it(`"${status}" + pitch_ok=null -> 0.0 (true 以外は 0)`, () => {
      expect(pitchScore({ evaluation_status: status, pitch_ok: null })).toBe(0.0)
    })
  }
})

describe("pitchScore: 代表ケースの意味づけ", () => {
  it("double_stop_full + pitch_ok=true -> 1.0 (全 pitch OK)", () => {
    expect(
      pitchScore({ evaluation_status: "double_stop_full", pitch_ok: true })
    ).toBe(1.0)
  })
  it("double_stop_miss + pitch_ok=false -> 0.0 (全 pitch NG)", () => {
    expect(
      pitchScore({ evaluation_status: "double_stop_miss", pitch_ok: false })
    ).toBe(0.0)
  })
  it("harmonic_ok + pitch_ok=true -> 1.0 (純度・音程 OK)", () => {
    expect(
      pitchScore({ evaluation_status: "harmonic_ok", pitch_ok: true })
    ).toBe(1.0)
  })
  it("harmonic_miss + pitch_ok=false -> 0.0 (鳴らず)", () => {
    expect(
      pitchScore({ evaluation_status: "harmonic_miss", pitch_ok: false })
    ).toBe(0.0)
  })
  it("pitch_only + pitch_ok=true -> 1.0 (音程のみ評価でも 1 点寄与)", () => {
    expect(
      pitchScore({ evaluation_status: "pitch_only", pitch_ok: true })
    ).toBe(1.0)
  })
})

describe("pitchScore: status 欠損時のフォールバック (pitch_ok のみで判断)", () => {
  it("status 無し + pitch_ok=true -> 1.0", () => {
    expect(pitchScore({ pitch_ok: true })).toBe(1.0)
  })
  it("status 無し + pitch_ok=false -> 0.0", () => {
    expect(pitchScore({ pitch_ok: false })).toBe(0.0)
  })
  it("status 無し + pitch_ok 無し -> 0.0", () => {
    expect(pitchScore({})).toBe(0.0)
  })
  it("【契約注意】pitchScore は isEvaluated を見ない: not_evaluated+pitch_ok=true でも 1.0", () => {
    // 単体では 1.0 を返すが、route では isEvaluated で filter 済のノートにのみ
    // 適用されるため実害なし。pitchScore を単独利用する新規 consumer への警告。
    expect(
      pitchScore({ evaluation_status: "not_evaluated", pitch_ok: true })
    ).toBe(1.0)
  })
})

// =========================================================
// route.ts (score-performances) の集計ロジックを純ヘルパーで再現。
// route.ts:96-104 と同一式。server deps を避けるため式のみ移植し、
// 実際に import する isEvaluated/pitchScore の合成挙動を検証する。
// =========================================================

type Note = { evaluation_status?: EvaluationStatus; pitch_ok?: boolean | null; start_ok?: boolean | null }

function aggregate(notes: Note[]) {
  const totalNotes = notes.length
  const evaluated = notes.filter(isEvaluated)
  if (totalNotes === 0) return { pitchAccuracy: null, timingAccuracy: null }
  const pitchOkSum = evaluated.reduce((sum, n) => sum + pitchScore(n), 0)
  const pitchAccuracy = Math.round((pitchOkSum / totalNotes) * 100)
  // 2026-08-27: タイミングの分母から測定不能 (pitch_only) を外す
  const timingPool = notes.filter((n) => n.evaluation_status !== "pitch_only")
  const timingOk = timingPool.filter((n) => n.start_ok === true).length
  const timingAccuracy = timingPool.length > 0
    ? Math.round((timingOk / timingPool.length) * 100)
    : null
  return { pitchAccuracy, timingAccuracy }
}

describe("route 集計合成 (isEvaluated + pitchScore, route.ts:96-104 相当)", () => {
  it("全ノート正解 -> 100/100", () => {
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
    ]
    expect(aggregate(notes)).toEqual({ pitchAccuracy: 100, timingAccuracy: 100 })
  })

  it("△を含む: 2音とも double_stop_partial -> pitch 0.5+0.5=1 / total 2 = 50%", () => {
    const notes: Note[] = [
      { evaluation_status: "double_stop_partial", pitch_ok: null, start_ok: true },
      { evaluation_status: "double_stop_partial", pitch_ok: null, start_ok: false },
    ]
    // pitchOkSum = 1.0, total 2 -> 50。timingOk = 1, total 2 -> 50
    expect(aggregate(notes)).toEqual({ pitchAccuracy: 50, timingAccuracy: 50 })
  })

  it("start_ok=null/false は timing で加点されない", () => {
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: null },
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: false },
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
    ]
    // timingOk = 1 / 3 = 33。pitch = 3/3 = 100
    expect(aggregate(notes)).toEqual({ pitchAccuracy: 100, timingAccuracy: 33 })
  })

  it("空配列 -> null/null", () => {
    expect(aggregate([])).toEqual({ pitchAccuracy: null, timingAccuracy: null })
  })

  // ---- 思想乖離の可視化: 分母 = totalNotes であり evaluated.length ではない ----
  it("【思想乖離】判定保留ノートは分母から外れず、実質ペナルティになる", () => {
    // INTENDED (comparisonResult.ts:123-125 コメント):
    //   spectral_inconclusive 等は「accuracy の分母から外す = 赤判定にしない」
    // ACTUAL (route.ts:102): pitchOkSum / totalNotes で totalNotes は全ノート数。
    //   → 保留ノートは分子(pitchScore)には入らないが分母には残る = 減点される。
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
      { evaluation_status: "spectral_inconclusive", pitch_ok: null, start_ok: null },
    ]
    const actual = aggregate(notes)
    // ACTUAL: 分母=2 なので 1/2 = 50 (保留ノートが減点として効く)
    expect(actual.pitchAccuracy).toBe(50)
    // もし INTENDED (分母=evaluated.length=1) なら 100 のはず。
    const intendedDenominator = notes.filter(isEvaluated).length // = 1
    const intendedPitchAccuracy = Math.round(
      (notes.filter(isEvaluated).reduce((s, n) => s + pitchScore(n), 0) /
        intendedDenominator) * 100
    )
    expect(intendedPitchAccuracy).toBe(100)
    // 50 !== 100 が乖離の証拠
    expect(actual.pitchAccuracy).not.toBe(intendedPitchAccuracy)
  })
})

// =========================================================
// 2026-08-27: 同じ音が続く区間はタイミングを測れないため、分母から外す。
// 旧実装は start_ok=true 固定で分子に加算しており、測っていない音を正解にしていた。
// =========================================================
describe("タイミングの分母 (測定不能を外す)", () => {
  it("pitch_only は分母からも分子からも外れる", () => {
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: false },
      { evaluation_status: "pitch_only", pitch_ok: true, start_ok: null },
      { evaluation_status: "pitch_only", pitch_ok: true, start_ok: null },
    ]
    // タイミング: 測れた2音のうち1音が正解 → 50%
    // 音程: 4音とも記録されている → 100%
    expect(aggregate(notes)).toEqual({ pitchAccuracy: 100, timingAccuracy: 50 })
  })

  it("not_detected は分母に残る (弾かれていないので不正解)", () => {
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
      { evaluation_status: "not_detected", pitch_ok: null, start_ok: null },
    ]
    // タイミング: 2音中1音が正解 → 50%
    expect(aggregate(notes).timingAccuracy).toBe(50)
  })

  it("音程がずれた pitch_only も音程の分母に残る (0点として)", () => {
    const notes: Note[] = [
      { evaluation_status: "evaluated", pitch_ok: true, start_ok: true },
      { evaluation_status: "pitch_only", pitch_ok: false, start_ok: null },
    ]
    // 音程: 2音中1音正解 → 50%。タイミング: 測れた1音が正解 → 100%
    expect(aggregate(notes)).toEqual({ pitchAccuracy: 50, timingAccuracy: 100 })
  })

  it("全音が測定不能なら タイミングは null", () => {
    const notes: Note[] = [
      { evaluation_status: "pitch_only", pitch_ok: true, start_ok: null },
    ]
    expect(aggregate(notes).timingAccuracy).toBeNull()
  })
})
