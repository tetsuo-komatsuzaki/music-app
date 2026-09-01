import { writeFileSync } from "fs"
import { QUESTS, MEDAL_MILESTONES, NINTEI_FACES } from "../app/_libs/treasureCatalog"
const wired = new Set(["basics_first","first_loop","lesson_first","annotate","loop_practice","pitch_cell","fingerboard_zoom","trajectory","guide_modal","karte_view"])
const out = QUESTS.map((q) => ({ no: q.no, id: q.questId, title: q.title, sub: q.sub, cat: q.category, type: q.type, grade: q.grade ?? null, home: !!q.home, hook: q.hook ?? null, counter: q.counter ?? null, wired: q.type === "event" ? wired.has(q.questId) : null }))
writeFileSync("_tmp/quests_dump.json", JSON.stringify({ quests: out, medals: MEDAL_MILESTONES, nintei: Object.keys(NINTEI_FACES) }, null, 1))
console.log("total", out.length, "event", out.filter((q) => q.type === "event").length, "counter", out.filter((q) => q.type === "counter").length, "unwired", out.filter((q) => q.wired === false).length)
