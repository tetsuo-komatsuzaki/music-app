/**
 * migrate-star-progress.ts — C-6b 論点1（2026-07-11 Tetsuo確定・案A）
 * 旧 UserGradeProgress.currentStar を新 UserStarProgress へ1回きり引き継ぐ。
 * 表示の連続性を守る移行。以後の昇格は新ルール（同★10曲達成）で進む。
 *
 * 実行: npx tsx scripts/migrate-star-progress.ts        # dry-run
 *       npx tsx scripts/migrate-star-progress.ts --apply
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const APPLY = process.argv.includes("--apply")

async function main() {
  const rows = await prisma.userGradeProgress.findMany({
    select: { userId: true, currentStar: true },
  })
  console.log(`旧UserGradeProgress: ${rows.length}件`)
  for (const r of rows) {
    const existing = await prisma.userStarProgress.findUnique({
      where: { userId: r.userId },
    })
    // 既に新体系で進んでいる場合は高い方を採用（下げない）
    const target = Math.max(existing?.currentStar ?? 1, r.currentStar)
    if (existing?.currentStar === target) {
      console.log(`  ${r.userId}: 変更なし (★${target})`)
      continue
    }
    console.log(`  ${r.userId}: ★${existing?.currentStar ?? "-"} → ★${target}${APPLY ? "" : " (dry-run)"}`)
    if (APPLY) {
      await prisma.userStarProgress.upsert({
        where: { userId: r.userId },
        create: { userId: r.userId, currentStar: target },
        update: { currentStar: target },
      })
    }
  }
  console.log(APPLY ? "適用完了" : "dry-run 完了（--apply で適用）")
}

main()
  .catch((e) => { console.error("ERR:", e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
