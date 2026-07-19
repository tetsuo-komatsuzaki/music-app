import { describe, it, expect } from "vitest"
import {
  SONG_GENRES,
  SONG_GENRE_IDS,
  SONG_GENRE_ORDER,
  songGenreLabel,
  isSongGenre,
} from "./songGenre"

// INTENDED: 曲(Score)のジャンル区分。全idが認識され、未知は拒否、ラベルは必ず存在する。

describe("SONG_GENRES 定義の健全性", () => {
  it("既知5ジャンルを定義順で持つ", () => {
    expect(SONG_GENRES.map((g) => g.id)).toEqual([
      "warabe",
      "shouka",
      "classic",
      "folk",
      "pops",
    ])
  })

  it("id は重複しない", () => {
    const ids = SONG_GENRES.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("全ジャンルが非空ラベルを持つ", () => {
    for (const g of SONG_GENRES) {
      expect(typeof g.label).toBe("string")
      expect(g.label.length).toBeGreaterThan(0)
    }
  })

  it("SONG_GENRE_IDS は SONG_GENRES の id と一致する", () => {
    expect(SONG_GENRE_IDS).toEqual(SONG_GENRES.map((g) => g.id))
  })

  it("SONG_GENRE_ORDER は定義順のラベル列と一致する", () => {
    expect(SONG_GENRE_ORDER).toEqual(SONG_GENRES.map((g) => g.label))
  })
})

describe("isSongGenre", () => {
  it("全ての定義済み id を受理する", () => {
    for (const id of SONG_GENRE_IDS) {
      expect(isSongGenre(id)).toBe(true)
    }
  })

  it("未知の値は拒否する", () => {
    for (const v of ["jazz", "rock", "", "WARABE", "warabe ", "その他", "song"]) {
      expect(isSongGenre(v)).toBe(false)
    }
  })
})

describe("songGenreLabel", () => {
  it("既知 id は対応ラベルを返す", () => {
    for (const g of SONG_GENRES) {
      expect(songGenreLabel(g.id)).toBe(g.label)
    }
  })

  it("未知 id / null / undefined / 空文字 は「その他」を返す", () => {
    expect(songGenreLabel("jazz")).toBe("その他")
    expect(songGenreLabel(null)).toBe("その他")
    expect(songGenreLabel(undefined)).toBe("その他")
    expect(songGenreLabel("")).toBe("その他")
  })
})
