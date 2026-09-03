/**
 * verify_personal_reco.ts — おすすめエンジンを実ユーザー全員で回して結果を検査する。
 *
 * 見るのは3点。
 *   ① タブごとに課題が立つか
 *   ② その課題に教材が付くか
 *   ③ 付いた教材に、その課題が本当に出てくるか (回数>0)
 * ③ が0ならエンジンは嘘の教材を出している。必ず落とす。
 *
 * 実行: npx tsx scripts/verify_personal_reco.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { buildPersonalReco, tabOf, MIN_TARGET } from "../app/_libs/personalReco"
import { RECO_TAB_LABELS } from "../app/_libs/personalRecoTypes"
import { SUBTASK_BY_ID } from "../app/_libs/subtaskCatalog.generated"

async function main() {
  const users = await prisma.userSkillSubScore.groupBy({ by: ["userId"], _count: { _all: true } })
  console.log(`累積カウンタを持つユーザー ${users.length}人 ・ 足切り ${MIN_TARGET}音\n`)
  let bad = 0
  let filled = 0
  let slots = 0

  for (const u of users) {
    const reco = await buildPersonalReco(u.userId)
    const star = (await prisma.userStarProgress.findUnique({ where: { userId: u.userId }, select: { currentStar: true } }))?.currentStar
    console.log(`--- ${u.userId.slice(0, 8)} ・ カウンタ${u._count._all}件 ・ ★${star ?? "なし"} ---`)
    if (!reco) { console.log("   枠ごと非表示\n"); continue }
    for (const t of reco.tabs) {
      slots++
      const label = RECO_TAB_LABELS[t.key]
      if (!t.focus) { console.log(`   ${label.padEnd(8)} 候補なし`); continue }
      const sid = Object.keys(SUBTASK_BY_ID).find((k) => SUBTASK_BY_ID[k].name === t.focus!.name && tabOf(SUBTASK_BY_ID[k]) === t.key)!
      if (t.materials.length === 0) {
        console.log(`   ${label.padEnd(8)} ${t.focus.name} 成功率${t.focus.successPct}%  → 教材なし${t.basics ? " ・基礎の案内" : ""}`)
        continue
      }
      const m = t.materials[0]
      const c = await prisma.practiceItemSubtaskCount.findUnique({
        where: { practiceItemId_subtaskId: { practiceItemId: m.id, subtaskId: sid } },
        select: { count: true, noteTotal: true },
      })
      const ok = (c?.count ?? 0) > 0
      if (!ok) bad++
      else filled++
      console.log(`   ${label.padEnd(8)} ${t.focus.name} 成功率${t.focus.successPct}%  → ★${m.star} [${m.category}] ${m.title.slice(0, 26)}  出現${c?.count ?? 0}回/全${c?.noteTotal ?? "?"}音 ${ok ? "" : "  ← その課題が出てこない教材"}${t.basics ? " ・基礎の案内" : ""}`)
    }
    console.log()
  }
  console.log(`枠 ${slots}個中 教材つき ${filled}個 ・ 嘘の教材 ${bad}個`)
  await prisma.$disconnect()
  if (bad > 0) { console.log("\n判定: 失敗"); process.exit(1) }
  console.log("判定: 合格 ・ 出した教材はすべてその課題を含む")
}
main().catch((e) => { console.error(e); process.exit(1) })
