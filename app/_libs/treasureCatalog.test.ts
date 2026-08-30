// カタログの機械検収 (観点14: 文言lint / 観点16: 番号規約)。
// 中身の変更はこのテストが通る形でのみ許可する。
import { describe, expect, it } from "vitest"
import { CLIENT_EVENT_QUEST_IDS, COUNTER_QUESTS, EVENT_QUESTS, MEDAL_MILESTONES, NINTEI_FACES, QUESTS } from "./treasureCatalog"

describe("treasureCatalog", () => {
  it("番号とquestIdがユニーク (再利用禁止)", () => {
    expect(new Set(QUESTS.map((q) => q.no)).size).toBe(QUESTS.length)
    expect(new Set(QUESTS.map((q) => q.questId)).size).toBe(QUESTS.length)
  })

  it("文言規約: 括弧禁止・絵文字禁止・長さ上限", () => {
    const banned = /[()（）]/
    // 記号・絵文字域 (UI文言規約: 文章に絵文字禁止)。★☆♪はアプリの定番記号として許可
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    const allowed = /[★☆♪]/gu
    for (const q of QUESTS) {
      expect(banned.test(q.title), `${q.no} ${q.title}`).toBe(false)
      expect(banned.test(q.sub), `${q.no} ${q.sub}`).toBe(false)
      expect(emoji.test((q.title + q.sub).replace(allowed, "")), `${q.no}`).toBe(false)
      expect(q.title.length, `${q.no} title too long`).toBeLessThanOrEqual(14)
      expect(q.sub.length, `${q.no} sub too long`).toBeLessThanOrEqual(16)
    }
  })

  it("型と定義の整合: event型はhook必須・counter型はcounter必須", () => {
    for (const q of EVENT_QUESTS) expect(q.hook, `${q.no}`).toBeTruthy()
    for (const q of COUNTER_QUESTS) {
      expect(q.counter, `${q.no}`).toBeTruthy()
      if (q.counter?.metric === "action") expect(q.counter.action, `${q.no}`).toBeTruthy()
    }
  })

  it("ホーム表示 = はじまりの旅カテゴリと一致 (2026-08-31 Tetsuo再編)", () => {
    for (const q of QUESTS) {
      expect(!!q.home, `${q.no} ${q.title}`).toBe(q.category === "はじまりの旅")
    }
  })

  it("認定証は最難関4件のみ", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51])
  })

  it("認定証の券面はcert 6件と一対一・文言規約に適合", () => {
    const certIds = QUESTS.filter((q) => q.grade === "cert").map((q) => q.questId).sort()
    expect(Object.keys(NINTEI_FACES).sort()).toEqual(certIds)
    const banned = /[()（）]/
    const emoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    for (const [id, f] of Object.entries(NINTEI_FACES)) {
      for (const text of [f.big, f.kindLine, f.body1, f.body2]) {
        expect(banned.test(text), `${id} ${text}`).toBe(false)
        expect(emoji.test(text), `${id} ${text}`).toBe(false)
      }
      expect(f.kindLine.endsWith("の認定証"), `${id} 種別行は〜の認定証`).toBe(true)
      expect(f.body1.length, `${id} body1 too long`).toBeLessThanOrEqual(30)
      expect(f.body2.length, `${id} body2 too long`).toBeLessThanOrEqual(30)
    }
  })

  it("メダルの節目は昇順ユニーク", () => {
    const m = [...MEDAL_MILESTONES]
    expect([...new Set(m)].length).toBe(m.length)
    expect(m).toEqual([...m].sort((a, b) => a - b))
  })

  it("欠番の遵守: 削除済み番号が復活していない", () => {
    const nos = new Set(QUESTS.map((q) => q.no))
    // 2026-08-30: 77-82 先生関連 / 87-88 メダル一本化 / 91 章廃止
    // 2026-08-31 Tetsuo再編で削除: 8-11,13-16,18,21 (操作系の整理・6=パート別に転用),
    // 23-26,33 (達成の中間), 34,35,40 (回数の下位), 54,55 (続ける力の一部),
    // 56-65 (いろんな曲の旅ごと), 72-75 (印・聴き返し・カルテ通い), 85,86,90 (重複整理)
    const dead = [
      8, 9, 10, 11, 13, 14, 15, 16, 18, 21,
      23, 24, 25, 26, 33, 34, 35, 40, 54, 55,
      56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
      72, 73, 74, 75, 77, 78, 79, 80, 81, 82,
      85, 86, 87, 88, 90, 91,
    ]
    for (const d of dead) {
      expect(nos.has(d), `no.${d} は欠番 (再利用禁止)`).toBe(false)
    }
  })

  it("recordQuestEvent 白リストはevent型と一致", () => {
    for (const id of CLIENT_EVENT_QUEST_IDS) {
      const q = QUESTS.find((x) => x.questId === id)
      expect(q?.type).toBe("event")
    }
  })
})
