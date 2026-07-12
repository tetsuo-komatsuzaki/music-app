/**
 * rename-technique-tags-20260714.ts — 技術タグ用語改定 (Tetsuo指示 2026-07-14)
 *   モルデント → プラルトリラーとモルデント
 *   ボウ・スタッカート → 連続スタッカート
 * 対象: TechniqueTag.name(マスタ) / UserTagAcquisition.tagKey / UserLessonClear.tagKey /
 *       TechniqueConfirmation.resolvedTag
 * 冪等 (旧名が無ければ0件更新)。ScoreTechniqueTag等はID参照のため無影響。
 * 実行: npx tsx scripts/rename-technique-tags-20260714.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const RENAMES: Array<[string, string]> = [
  ["モルデント", "プラルトリラーとモルデント"],
  ["ボウ・スタッカート", "連続スタッカート"],
]

async function main() {
  for (const [oldName, newName] of RENAMES) {
    const [tag, acq, clear, conf] = await prisma.$transaction([
      prisma.techniqueTag.updateMany({ where: { name: oldName }, data: { name: newName } }),
      prisma.userTagAcquisition.updateMany({
        where: { tagType: "technique", tagKey: oldName },
        data: { tagKey: newName },
      }),
      prisma.userLessonClear.updateMany({
        where: { tagType: "technique", tagKey: oldName },
        data: { tagKey: newName },
      }),
      prisma.techniqueConfirmation.updateMany({
        where: { resolvedTag: oldName },
        data: { resolvedTag: newName },
      }),
    ])
    console.log(
      `${oldName} → ${newName}: TechniqueTag=${tag.count} / 自己申告=${acq.count} / クリア記録=${clear.count} / 確認キュー=${conf.count}`,
    )
  }
  const names = await prisma.techniqueTag.findMany({ select: { name: true }, orderBy: { name: "asc" } })
  console.log("マスタ現況:", names.map((n) => n.name).join(" / "))
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
