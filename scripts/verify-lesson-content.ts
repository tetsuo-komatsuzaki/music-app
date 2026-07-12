/**
 * verify-lesson-content.ts — LESSONS(実装) と 教材データJSON v1.0 の全文一致検証
 * 実装指示書v1.2 §0-2「教材データJSONとの数値diff: なし」の証跡を出力する。
 * 実行: npx tsx scripts/verify-lesson-content.ts
 */
import { LESSONS, CATS } from "../app/[userId]/lessons/_lib/content"
import lessonData from "../app/[userId]/lessons/_lib/lessonData.v1_0.json"

let fail = 0
const t = (name: string, cond: boolean, detail = "") => {
  if (cond) console.log(`  PASS ${name}`)
  else {
    fail++
    console.log(`  FAIL ${name} ${detail}`)
  }
}

t("レッスン数 = 23", LESSONS.length === 23 && lessonData.lessons.length === 23)
t(
  "id順序が完全一致",
  JSON.stringify(LESSONS.map((l) => l.id)) === JSON.stringify(lessonData.lessons.map((l) => l.id)),
)

for (const jl of lessonData.lessons) {
  const il = LESSONS.find((l) => l.id === jl.id)
  if (!il) {
    fail++
    console.log(`  FAIL 実装に ${jl.id} が無い`)
    continue
  }
  const same =
    il.name === jl.name &&
    il.cat === jl.cat &&
    il.figType === jl.figType &&
    JSON.stringify(il.figs) === JSON.stringify(jl.figs) &&
    JSON.stringify(il.texts) === JSON.stringify(jl.texts) &&
    JSON.stringify(il.terms) === JSON.stringify(jl.terms)
  t(`${jl.id} (${jl.name}) 全項目一致`, same)
  t(`${jl.id} texts=5枚/terms=5枚`, jl.texts.length === 5 && jl.terms.length === 5)
}

t(
  "カテゴリ定義一致 (bow/left/both)",
  JSON.stringify(CATS) === JSON.stringify(lessonData.categories),
)
const counts = { bow: 0, left: 0, both: 0 } as Record<string, number>
for (const l of LESSONS) counts[l.cat]++
t("分類: 弓系8 / 左手10 / 重音系5", counts.bow === 8 && counts.left === 10 && counts.both === 5,
  JSON.stringify(counts))

console.log(`\n${fail === 0 ? "ALL PASS (教材データJSONとの diff なし)" : `FAILED (${fail})`}`)
if (fail > 0) process.exitCode = 1
