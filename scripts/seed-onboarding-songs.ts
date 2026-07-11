/**
 * seed-onboarding-songs.ts — 曲カタログ v1.0 のDB投入 (C5・2026-07-12)
 * 正本: app/onboarding/_lib/catalog.ts (= arcoda_曲カタログ_v1.0_確定.md)。
 * upsert で再実行安全。以後の追加・難易度再査定はDB直あるいは管理UIで。
 *
 * 実行: npx tsx scripts/seed-onboarding-songs.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { CATALOG } from "../app/onboarding/_lib/catalog"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  let n = 0
  for (const [category, c] of Object.entries(CATALOG)) {
    for (let i = 0; i < c.songs.length; i++) {
      const [name, star] = c.songs[i]
      await prisma.onboardingSong.upsert({
        where: { category_name: { category, name } },
        create: { category, name, star, sortOrder: i },
        update: { star, sortOrder: i, isActive: true },
      })
      n++
    }
  }
  const total = await prisma.onboardingSong.count()
  console.log(`OnboardingSong seed 完了: upsert=${n} 総数=${total}`)
}

main()
  .catch((e) => { console.error("ERR:", e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
