/**
 * verify_subtask_material_reach.ts — 課題カタログの教材条件が実在の在庫に届くかを検査する。
 *
 * 2026-09-04 に発覚した2種の壊れ方を二度と通さないための門番。
 *   ① 存在しないカテゴリを指す (ポジション移動の category: position_shift)
 *   ② 後から在庫の方針を変えたのに条件を追随させていない (音階を外したのに条件は音階のまま)
 *
 * 判定は本番の在庫と本番の照合関数 (weaknessRecommendation の在庫取得) で行う。
 * カタログ側の自己申告ではなく、実際に引けるかどうかだけを見る。
 *
 * 在庫が本当に無いものは EXPECTED_NO_STOCK に理由つきで登録する。
 * ここに無い項目が0件になったら失敗させる。逆に、登録済みの項目が引けるように
 * なったら「登録から外せ」と失敗させる。放置された言い訳が溜まらないようにする。
 *
 * 実行: npx tsx scripts/verify_subtask_material_reach.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { SUBTASK_CATALOG, type MaterialQuery, type SubtaskDef } from "../app/_libs/subtaskCatalog.generated"
import { getInventory, type MaterialCandidate } from "../app/_libs/weaknessRecommendation"

/** 在庫が本当に無い項目。キー = 課題ID の接尾辞、値 = 理由 */
const EXPECTED_NO_STOCK: { match: (d: SubtaskDef) => boolean; why: string }[] = [
  {
    match: (d) =>
      d.problem === "technique" &&
      ["bow_staccato", "ricochet", "vibrato", "trill", "mordent", "glissando", "harmonic"]
        .some((t) => d.id.endsWith(`_tech_${t}`)),
    why: "その奏法の教材が1件も無い。条件は正しく、在庫の穴",
  },
]

function matches(item: MaterialCandidate, q: MaterialQuery): boolean {
  switch (q.type) {
    case "feature":
      return item.featureTags.some((f) => f.category === q.category && f.name === q.name)
    case "technique":
      return item.techniqueNames.includes(q.name)
    case "category":
      return item.category === q.category
    case "basic":
      return item.category === "scale"
  }
}

async function main() {
  const inv = await getInventory()
  const targets = SUBTASK_CATALOG.filter((d) => d.diagnosable && d.v1Active)
  const fail: string[] = []
  const stale: string[] = []
  let ok = 0

  for (const d of targets) {
    const reach = d.materialQuery.filter((q) => inv.some((it) => matches(it, q)))
    const allowed = EXPECTED_NO_STOCK.find((e) => e.match(d))
    if (reach.length > 0) {
      ok++
      if (allowed) stale.push(`${d.id} … ${d.name} は引けるようになった。EXPECTED_NO_STOCK から外すこと`)
      continue
    }
    if (allowed) continue
    fail.push(
      `${d.id} … ${d.name} / 条件 ${JSON.stringify(d.materialQuery)} がどれも0件`
    )
  }

  const covered = targets.length - fail.length - stale.length
  console.log(`診断対象 ${targets.length}項目`)
  console.log(`  教材に届く            ${ok}項目`)
  console.log(`  在庫なしとして登録済み  ${targets.length - ok}項目`)
  if (stale.length) {
    console.log(`\n登録が古い ${stale.length}件`)
    for (const s of stale) console.log(`   ${s}`)
  }
  if (fail.length) {
    console.log(`\n届かない ${fail.length}件`)
    for (const f of fail) console.log(`   ${f}`)
  }
  await prisma.$disconnect()
  if (fail.length || stale.length) {
    console.log(`\n判定: 失敗 (未登録の0件 ${fail.length} ・ 古い登録 ${stale.length})`)
    process.exit(1)
  }
  console.log(`\n判定: 合格 ・ ${covered}項目が在庫に届き、残りは理由つきで登録済み`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
