/**
 * cleanup_removed_subtasks.ts — カタログから削除した課題の DB 行を消す。
 *
 * 2026-09-04 (Tetsuo): 音程移動の順次・弦とばし と 音価の全/2分/4分 を課題から削除した。
 * 画面側は SUBTASK_BY_ID で引いて無ければ捨てるので残っても壊れないが、
 * 累積カウンタ (UserSkillSubScore) と教材の出現回数 (PracticeItemSubtaskCount) に
 * 行が残ると集計の分母がずれるので消す。
 *
 * 実行: npx tsx scripts/cleanup_removed_subtasks.ts          (dry-run・件数だけ)
 *       npx tsx scripts/cleanup_removed_subtasks.ts --apply  (削除)
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { SUBTASK_BY_ID } from "../app/_libs/subtaskCatalog.generated"

const TREES = ["pitch", "rhythm", "timbre"]
const REMOVED: string[] = []
for (const t of TREES) {
  for (const cross of ["same", "adj", "skip"]) {
    for (const dir of ["up", "down"]) {
      for (const dist of ["step", "leap"]) {
        if (dist === "step" || cross === "skip") REMOVED.push(`${t}_interval_${cross}_${dir}_${dist}`)
      }
    }
  }
}
for (const t of ["rhythm", "timbre"]) {
  for (const v of ["whole", "half", "quarter"]) REMOVED.push(`${t}_value_${v}`)
}

async function main() {
  const apply = process.argv.includes("--apply")
  // 消すIDがカタログに残っていたら生成が古い。止める
  const still = REMOVED.filter((id) => SUBTASK_BY_ID[id])
  if (still.length) {
    console.log(`カタログにまだ残っている: ${still.join(", ")} ・ 生成器を先に直すこと`)
    process.exit(1)
  }
  const uss = await prisma.userSkillSubScore.count({ where: { skillSubTaskId: { in: REMOVED } } })
  const pisc = await prisma.practiceItemSubtaskCount.count({ where: { subtaskId: { in: REMOVED } } })
  console.log(`削除対象 ${REMOVED.length} ID`)
  console.log(`  UserSkillSubScore        ${uss}行`)
  console.log(`  PracticeItemSubtaskCount ${pisc}行`)
  if (!apply) {
    console.log("\ndry-run のため削除なし。--apply で本実行")
  } else {
    const a = await prisma.userSkillSubScore.deleteMany({ where: { skillSubTaskId: { in: REMOVED } } })
    const b = await prisma.practiceItemSubtaskCount.deleteMany({ where: { subtaskId: { in: REMOVED } } })
    console.log(`\n削除した: UserSkillSubScore ${a.count}行 ・ PracticeItemSubtaskCount ${b.count}行`)
  }
  await prisma.$disconnect()
}
main()
