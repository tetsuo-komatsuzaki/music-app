import { config } from "dotenv"
config()
async function main() {
  const { prisma } = await import("../app/_libs/prisma")
  // 前提検証: ★1〜2の共有曲にわざタグは付いているか
  for (const star of [1, 2, 3]) {
    const scores = await prisma.score.findMany({
      where: { star, ownerScope: "admin", isShared: true, deletedAt: null },
      take: 6, select: { id: true, title: true },
    })
    for (const s of scores) {
      const tags = await prisma.scoreTechniqueTag.findMany({
        where: { scoreId: s.id }, select: { techniqueTag: { select: { name: true } }, isPrimary: true },
      })
      console.log(`★${star}`, s.title.slice(0, 12), "tags:", tags.map(t => `${t.techniqueTag.name}${t.isPrimary ? "*" : ""}`).join(",") || "(なし)")
    }
  }
}
main()
