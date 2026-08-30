// カタログの機械検収 (観点14: 文言lint / 観点16: 番号規約)。
// 中身の変更はこのテストが通る形でのみ許可する。
import { describe, expect, it } from "vitest"
import { CLIENT_EVENT_QUEST_IDS, COUNTER_QUESTS, EVENT_QUESTS, MEDAL_MILESTONES, QUESTS } from "./treasureCatalog"

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

  it("操作系 (home表示) はevent型のみ", () => {
    for (const q of QUESTS.filter((x) => x.home)) expect(q.type).toBe("event")
  })

  it("認定証は最難関6件のみ", () => {
    expect(QUESTS.filter((q) => q.grade === "cert").map((q) => q.no).sort((a, b) => a - b))
      .toEqual([30, 39, 45, 51, 59, 90])
  })

  it("メダルの節目は昇順ユニーク", () => {
    const m = [...MEDAL_MILESTONES]
    expect([...new Set(m)].length).toBe(m.length)
    expect(m).toEqual([...m].sort((a, b) => a - b))
  })

  it("欠番の遵守: 削除済み番号が復活していない", () => {
    const nos = new Set(QUESTS.map((q) => q.no))
    for (const dead of [77, 78, 79, 80, 81, 82, 87, 88, 91]) {
      expect(nos.has(dead), `no.${dead} は欠番 (再利用禁止)`).toBe(false)
    }
  })

  it("recordQuestEvent 白リストはevent型と一致", () => {
    for (const id of CLIENT_EVENT_QUEST_IDS) {
      const q = QUESTS.find((x) => x.questId === id)
      expect(q?.type).toBe("event")
    }
  })
})
