// 自由記入癖の合成タグID (2026-08-16)。カタログ非依存の往復・解決・部位対応を固定する。
import { describe, it, expect } from "vitest"
import { makeCustomTagId, parseCustomTagId, resolveObsTag, OBSERVATION_TAG_BY_ID } from "./observationCatalog"
import { spotOfTag, SPOT_BY_ID, BODY_SPOTS } from "./bodyMap"

describe("自由記入の合成タグID", () => {
  it("往復できる (make→parse)", () => {
    const id = makeCustomTagId("frog_left_wrist", "弓の持ち替えで力む")
    expect(parseCustomTagId(id)).toEqual({ spotId: "frog_left_wrist", label: "弓の持ち替えで力む" })
  })

  it("区切り文字::を含む文言は潰して安全化する", () => {
    const id = makeCustomTagId("body_left_wrist", "a::b")
    expect(parseCustomTagId(id)?.label).toBe("a:b")
  })

  it("40字で切り詰める", () => {
    const id = makeCustomTagId("tip_left_elbow", "あ".repeat(60))
    expect(parseCustomTagId(id)?.label).toHaveLength(40)
  })

  it("resolveObsTag はカタログと自由記入の両対応・未知IDは undefined", () => {
    expect(resolveObsTag("bow_pressure_heavy")?.label).toBe("弓の圧が強すぎる")
    expect(resolveObsTag(makeCustomTagId("frog_left_wrist", "テスト"))).toEqual({ label: "テスト", category: "custom", categoryLabel: "先生の記入" })
    expect(resolveObsTag("unknown_tag")).toBeUndefined()
    expect(resolveObsTag("custom::frog_left_wrist")).toBeUndefined() // 文言なしは不正
  })

  it("spotOfTag はカタログのマッピングと自由記入の埋め込み部位の両対応", () => {
    expect(spotOfTag("bow_pressure_heavy")?.id).toBe("frog_right_wrist")
    expect(spotOfTag(makeCustomTagId("tip_left_wrist", "x"))?.id).toBe("tip_left_wrist")
    expect(spotOfTag("rhythm_rush")).toBeUndefined() // 体の外
  })

  it("マッピング済みタグは全てカタログに実在し、部位IDは一意", () => {
    for (const s of BODY_SPOTS) {
      for (const t of s.tagIds) expect(OBSERVATION_TAG_BY_ID[t], `${s.id}の${t}`).toBeTruthy()
    }
    expect(Object.keys(SPOT_BY_ID)).toHaveLength(BODY_SPOTS.length)
  })
})
