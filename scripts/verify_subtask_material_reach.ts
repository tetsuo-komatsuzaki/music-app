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
 * 検査は2段。
 *   Level 1 条件が在庫の教材にマッチするか
 *   Level 2 マッチした教材に、その課題が本当に出てくるか (出現回数 > 0)
 * Level 1 だけだと「フィンガリング教材にマッチしたが、その教材にポジション移動は
 * 1音も無い」を見逃す。実際にそれが起きたので Level 2 を足した。
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
    match: (d) => d.problem === "position_shift",
    why: "position_shift カテゴリの教材が1件も無い。条件は正しく、在庫の穴",
  },
  {
    match: (d) =>
      d.problem === "technique" &&
      ["bow_staccato", "ricochet", "vibrato", "trill", "mordent", "glissando", "harmonic"]
        .some((t) => d.id.endsWith(`_tech_${t}`)),
    why: "その奏法の教材が1件も無い。条件は正しく、在庫の穴",
  },
  {
    match: (d) =>
      d.problem === "technique" &&
      ["portato", "staccato", "spiccato", "pizzicato", "tremolo"]
        .some((t) => d.id.endsWith(`_tech_${t}`)),
    why:
      "教材の楽譜ファイルが v121 より前に作られており、音符ごとの奏法が入っていない。" +
      "教材を作り直せば引けるようになる一時的な状態。スラーだけは is_in_slur から復元済み",
  },
  {
    match: (d) => d.problem === "tuplet" && !d.id.endsWith("_tuplet_3"),
    why:
      "連符の実際の数 (tuplet_actual) は analysis.json 側にあり教材のカルテには無い。" +
      "回数の集計では三連符に既定されるため 5/6/7以上 が立たない。集計の限界",
  },
  {
    match: (d) => d.id === "rhythm_entry_long_offbeat",
    why: "長い休みのあと拍の裏から入る箇所を含む教材が1件も無い。在庫の穴",
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
  // Level 2 用: 教材ごとの課題出現回数
  const counts = await prisma.practiceItemSubtaskCount.findMany({
    select: { practiceItemId: true, subtaskId: true, count: true },
  })
  const has = new Set(counts.filter((c) => c.count > 0).map((c) => `${c.practiceItemId}|${c.subtaskId}`))
  const targets = SUBTASK_CATALOG.filter((d) => d.diagnosable && d.v1Active)
  const fail: string[] = []
  const stale: string[] = []
  let ok = 0

  for (const d of targets) {
    // Level 1 と Level 2 を同時に見る。条件にマッチし、かつその教材に
    // その課題が実際に出てくるものが1件でもあれば「届く」
    const reach = d.materialQuery.filter((q) =>
      inv.some((it) => matches(it, q) && has.has(`${it.id}|${d.id}`))
    )
    const allowed = EXPECTED_NO_STOCK.find((e) => e.match(d))
    if (reach.length > 0) {
      ok++
      if (allowed) stale.push(`${d.id} … ${d.name} は引けるようになった。EXPECTED_NO_STOCK から外すこと`)
      continue
    }
    if (allowed) continue
    fail.push(
      `${d.id} … ${d.name} / 条件 ${JSON.stringify(d.materialQuery)} ` +
        `にマッチする教材の中に、この課題が出てくるものが無い`
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
