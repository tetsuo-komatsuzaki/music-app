import { describe, it, expect } from "vitest"
import {
  LESSONS,
  LESSON_BY_ID,
  LESSON_BY_TAG,
  LESSON_TOTAL,
  lessonFingerNumbers,
  FEEDBACK,
} from "./content"
import { positionTagKey, tagId } from "@/app/_libs/lessonStatus"

// 学びレッスン23本のコンテンツ定義とタグ対応の整合性。
// 正本はタグ (technique/position/double_stop)。position は "2".."6" (6=6th以上・確定#8)。

describe("content: レッスン集合", () => {
  it("全23本 (LESSON_TOTAL) が読み込まれ id は一意", () => {
    expect(LESSON_TOTAL).toBe(23)
    expect(LESSONS.length).toBe(23)
    expect(LESSON_BY_ID.size).toBe(23)
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(23)
  })

  it("全レッスンにタグが解決されている (TAG_MAP 未定義なら import 時 throw)", () => {
    for (const l of LESSONS) {
      expect(l.tag.tagType).toBeTruthy()
      expect(l.tag.tagKey).toBeTruthy()
    }
  })

  it("position タグの key は positionTagKey の正規化結果と整合 ('2'..'6')", () => {
    for (const l of LESSONS) {
      if (l.tag.tagType !== "position") continue
      // 2nd以上のみタグ化され、6以上は "6"
      expect(["2", "3", "4", "5", "6"]).toContain(l.tag.tagKey)
      // positionTagKey に同じ数字を通しても不変 (冪等・同一正規化)
      expect(positionTagKey(l.tag.tagKey)).toBe(l.tag.tagKey)
    }
  })

  it("LESSON_BY_TAG は tagId(tagType:tagKey) で逆引きできタグは一意", () => {
    expect(LESSON_BY_TAG.size).toBe(23) // タグ重複なし
    for (const l of LESSONS) {
      const key = tagId(l.tag)
      expect(LESSON_BY_TAG.get(key)?.id).toBe(l.id)
    }
  })

  it("cat は bow/left/both のいずれか、figType は bow/fb", () => {
    for (const l of LESSONS) {
      expect(["bow", "left", "both"]).toContain(l.cat)
      expect(["bow", "fb"]).toContain(l.figType)
      expect(l.texts).toHaveLength(5)
      expect(l.terms).toHaveLength(5)
      expect(l.figs).toHaveLength(3)
    }
  })
})

describe("content: lessonFingerNumbers", () => {
  it("存在しないレッスンは空配列", () => {
    expect(lessonFingerNumbers("__nope__")).toEqual([])
  })

  it("fg があればそれを、無ければ A線1stポジションの運指を音高から導出 (pos2)", () => {
    // pos2: A4→'0'(導出), B4→'1'(導出), C5 は fg='1' 指定なので導出値'2'ではなく'1'
    expect(lessonFingerNumbers("pos2")).toEqual(["0", "1", "1"])
  })

  it("開放弦からの上行スケールは 0,1,2,3 (staccato)", () => {
    expect(lessonFingerNumbers("staccato")).toEqual(["0", "1", "2", "3"])
  })

  it("全レッスンで例外なく (string|undefined)[] を返す", () => {
    for (const l of LESSONS) {
      const arr = lessonFingerNumbers(l.id)
      expect(Array.isArray(arr)).toBe(true)
      for (const v of arr) {
        expect(v === undefined || typeof v === "string").toBe(true)
      }
    }
  })
})

describe("content: FEEDBACK", () => {
  it("固定3種の掛け声を返し、1つ目に教材名が埋め込まれる", () => {
    const fb = FEEDBACK("スタッカート")
    expect(fb).toHaveLength(3)
    expect(fb[0]).toContain("スタッカート")
    expect(fb.every((s) => typeof s === "string" && s.length > 0)).toBe(true)
  })
})
